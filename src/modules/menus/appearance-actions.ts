"use server";

import { revalidatePath } from "next/cache";

import { clientIpFromForwarded } from "@/lib/auth/ip";
import { parseLocale } from "@/lib/auth/schemas";
import { canEditBusiness } from "@/lib/businesses/access";
import {
  buildMediaPath,
  imageExtension,
  isSafeMediaPath,
  maxImageBytes,
  publicMediaUrl,
} from "@/lib/businesses/media";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { appearanceRecord, defaultAppearance, normalizeMenuTheme, parseAppearance, type MenuAppearance } from "@/lib/menus/appearance";
import { menuRateLimiter, menuRateLimits } from "@/lib/menus/rate-limit";
import { refreshPublicMenu } from "@/lib/menus/refresh-public-menu";
import type { MenuMessageCode } from "@/lib/menus/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

import { themeIsAllowed } from "@/modules/billing/queries";

import { requireMenu } from "./menu-access";

const mediaBucket = "business-media";

type AppearanceActionState =
  | {
      ok: true;
      message: "saved";
      appearance: MenuAppearance;
      logoUrl: string | null;
      coverUrl: string | null;
    }
  | { ok: false; message: MenuMessageCode; appearance?: MenuAppearance };

type ImageChoice =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "replace"; file: File }
  | { kind: "invalid"; message: MenuMessageCode };

export async function saveAppearanceAction(
  _state: AppearanceActionState | null,
  formData: FormData,
): Promise<AppearanceActionState> {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  if (!locale || !access) {
    return { ok: false, message: "not_found" };
  }

  if (!canEditBusiness(access.business.role)) {
    return { ok: false, message: "forbidden" };
  }

  if (access.unconfigured || !access.supabase) {
    return { ok: false, message: "unconfigured" };
  }

  let supabaseUrl: string;
  try {
    supabaseUrl = getPublicEnv().NEXT_PUBLIC_SUPABASE_URL;
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return { ok: false, message: "unconfigured" };
    }
    throw error;
  }

  const applied = normalizeMenuTheme(formData.get("applyTheme"));
  const appearance = applied
    ? defaultAppearance(applied)
    : parseAppearance({
    theme: formData.get("theme"),
    primary: formData.get("primary"),
    secondary: formData.get("secondary"),
    background: formData.get("background"),
    text: formData.get("text"),
    font: formData.get("font"),
    typeScale: formData.get("typeScale"),
    cardLayout: formData.get("cardLayout"),
    imageRatio: formData.get("imageRatio"),
    radius: formData.get("radius"),
    spacing: formData.get("spacing"),
    navStyle: formData.get("navStyle"),
    featuredStyle: formData.get("featuredStyle"),
  });
  if (!appearance) {
    return { ok: false, message: "appearance_invalid" };
  }

  try {
    const allowed = await themeIsAllowed(access.business.id, appearance.theme);
    if (!allowed) {
      return { ok: false, message: "theme_locked" };
    }
  } catch {
    return { ok: false, message: "save_failed" };
  }

  const current = await access.supabase
    .from("businesses")
    .select("logo_path, cover_path")
    .eq("id", access.business.id)
    .maybeSingle();
  if (current.error || !current.data) {
    return { ok: false, message: "save_failed" };
  }

  const logo = imageChoice(formData.get("logo"), formData.get("removeLogo") === "on");
  const cover = imageChoice(formData.get("cover"), formData.get("removeCover") === "on");
  if (logo.kind === "invalid") {
    return { ok: false, message: logo.message };
  }
  if (cover.kind === "invalid") {
    return { ok: false, message: cover.message };
  }

  const limit = menuRateLimiter.consume(`menu-write:${await requestIp()}`, menuRateLimits.write);
  if (!limit.ok) {
    return { ok: false, message: "rate_limited" };
  }

  const existing = await access.supabase
    .from("business_theme_settings")
    .select("business_id")
    .eq("business_id", access.business.id)
    .maybeSingle();
  if (existing.error) {
    return { ok: false, message: "save_failed" };
  }

  const record = appearanceRecord(appearance);
  const write = existing.data
    ? await access.supabase
        .from("business_theme_settings")
        .update(record)
        .eq("business_id", access.business.id)
        .select("business_id")
    : await access.supabase
        .from("business_theme_settings")
        .insert({ business_id: access.business.id, ...record })
        .select("business_id");
  if (write.error || !write.data?.length) {
    if (write.error?.message.includes("theme_locked")) {
      return { ok: false, message: "theme_locked" };
    }
    return { ok: false, message: "save_failed" };
  }

  const logoResult = await storeImage(access.supabase, access.business.id, "logo", logo, current.data.logo_path);
  if (logoResult) {
    return finishSavedTheme(locale, access.business, appearance, logoResult);
  }

  const coverResult = await storeImage(access.supabase, access.business.id, "cover", cover, current.data.cover_path);
  if (coverResult) {
    return finishSavedTheme(locale, access.business, appearance, coverResult);
  }

  const stored = await access.supabase
    .from("businesses")
    .select("logo_path, cover_path")
    .eq("id", access.business.id)
    .maybeSingle();
  if (stored.error || !stored.data) {
    return finishSavedTheme(locale, access.business, appearance, "save_failed");
  }

  revalidatePath(`/${locale}/dashboard/businesses/${access.business.id}`);
  revalidatePath(`/${locale}/dashboard/businesses/${access.business.id}/menu`);
  refreshPublicMenu(access.business.slug);

  return {
    ok: true,
    message: "saved",
    appearance,
    logoUrl: publicMediaUrl(supabaseUrl, stored.data.logo_path),
    coverUrl: publicMediaUrl(supabaseUrl, stored.data.cover_path),
  };
}

function finishSavedTheme(
  locale: string,
  business: { id: string; slug: string },
  appearance: MenuAppearance,
  message: MenuMessageCode,
): AppearanceActionState {
  revalidatePath(`/${locale}/dashboard/businesses/${business.id}`);
  revalidatePath(`/${locale}/dashboard/businesses/${business.id}/menu`);
  refreshPublicMenu(business.slug);
  return { ok: false, message, appearance };
}

function imageChoice(entry: FormDataEntryValue | null, remove: boolean): ImageChoice {
  const file = entry instanceof File && entry.size > 0 ? entry : null;
  if (!file) {
    return remove ? { kind: "remove" } : { kind: "keep" };
  }

  if (file.size > maxImageBytes) {
    return { kind: "invalid", message: "image_too_large" };
  }

  if (!imageExtension(file.type)) {
    return { kind: "invalid", message: "image_type" };
  }

  return { kind: "replace", file };
}

async function storeImage(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  businessId: string,
  kind: "logo" | "cover",
  choice: Exclude<ImageChoice, { kind: "invalid" }>,
  previousPath: string | null,
): Promise<MenuMessageCode | null> {
  if (choice.kind === "keep") {
    return null;
  }

  if (choice.kind === "remove") {
    const patch = kind === "logo" ? { logo_path: null } : { cover_path: null };
    const { error } = await supabase.from("businesses").update(patch).eq("id", businessId);
    if (error) {
      return "image_failed";
    }

    await removeStoredObject(supabase, businessId, previousPath);
    return null;
  }

  const extension = imageExtension(choice.file.type);
  if (!extension) {
    return "image_type";
  }

  const path = buildMediaPath(businessId, kind, extension, crypto.randomUUID());
  if (!isSafeMediaPath(businessId, path, kind)) {
    return "image_failed";
  }

  const bytes = new Uint8Array(await choice.file.arrayBuffer());
  if (bytes.byteLength === 0) {
    return "image_failed";
  }
  if (bytes.byteLength > maxImageBytes) {
    return "image_too_large";
  }

  const { error: uploadError } = await supabase.storage.from(mediaBucket).upload(path, new Blob([bytes], { type: choice.file.type }), {
    contentType: choice.file.type,
    upsert: false,
  });
  if (uploadError) {
    console.error(`appearance image upload failed: ${uploadError.message}`);
    return "image_failed";
  }

  const patch = kind === "logo" ? { logo_path: path } : { cover_path: path };
  const { error } = await supabase.from("businesses").update(patch).eq("id", businessId);
  if (error) {
    console.error(`appearance image record failed: ${error.message}`);
    await removeStoredObject(supabase, businessId, path);
    return "image_failed";
  }

  if (previousPath && previousPath !== path) {
    await removeStoredObject(supabase, businessId, previousPath);
  }

  return null;
}

async function removeStoredObject(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  businessId: string,
  path: string | null,
) {
  if (!path || !isSafeMediaPath(businessId, path)) {
    return;
  }

  await supabase.storage.from(mediaBucket).remove([path]);
}

async function requestIp() {
  const headerStore = await headers();
  return clientIpFromForwarded(headerStore.get("x-forwarded-for"), headerStore.get("x-real-ip"));
}
