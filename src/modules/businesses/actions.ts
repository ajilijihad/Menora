"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { refreshPublicMenu } from "@/lib/menus/refresh-public-menu";

import { clientIpFromForwarded } from "@/lib/auth/ip";
import { parseLocale } from "@/lib/auth/schemas";
import { canDeleteBusiness, canEditBusiness } from "@/lib/businesses/access";
import { idleBusinessState, type BusinessFormState, type DeleteBusinessState } from "@/lib/businesses/form-state";
import { parseBusinessId } from "@/lib/businesses/ids";
import {
  buildMediaPath,
  imageExtension,
  isSafeMediaPath,
  maxImageBytes,
} from "@/lib/businesses/media";
import { businessRateLimiter, businessRateLimits } from "@/lib/businesses/rate-limit";
import {
  openingHoursForStorage,
  parseBusinessForm,
  readBusinessFormValues,
  type BusinessMessageCode,
} from "@/lib/businesses/schema";
import { uniqueSlug } from "@/lib/businesses/slug";
import { EnvConfigError } from "@/lib/env/error";
import type { Json } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/modules/auth";
import { canAddBusiness } from "@/modules/billing/queries";

import { getMyBusiness } from "./queries";

const mediaBucket = "business-media";

function failure(
  message: BusinessMessageCode,
  values?: BusinessFormState["values"],
  fieldErrors?: BusinessFormState["fieldErrors"],
): BusinessFormState {
  return { status: "error", message, values, fieldErrors };
}

function formRecord(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries());
}

async function requestIp() {
  const headerStore = await headers();
  return clientIpFromForwarded(
    headerStore.get("x-forwarded-for"),
    headerStore.get("x-real-ip"),
  );
}

async function sessionClient() {
  try {
    return await createServerSupabaseClient();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return null;
    }

    throw error;
  }
}

function profilePayload(data: {
  name: string;
  slug: string;
  businessType: "restaurant" | "cafe" | "bakery" | "other";
  description: string | null;
  phone: string | null;
  address: string | null;
  mapUrl: string | null;
  openingHours: Parameters<typeof openingHoursForStorage>[0];
  socialLinks: Record<string, string>;
  defaultLanguage: "en" | "ar";
  timeZone: string;
}) {
  return {
    name: data.name,
    slug: data.slug,
    business_type: data.businessType,
    description: data.description,
    phone: data.phone,
    address: data.address,
    map_url: data.mapUrl,
    opening_hours: openingHoursForStorage(data.openingHours) as Json,
    social_links: data.socialLinks as Json,
    default_language: data.defaultLanguage,
    time_zone: data.timeZone,
  };
}

type ImageChoice =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "replace"; file: File }
  | { kind: "invalid"; message: BusinessMessageCode };

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

async function storeImage(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  businessId: string,
  kind: "logo" | "cover",
  choice: ImageChoice,
  previousPath: string | null,
): Promise<BusinessMessageCode | null> {
  if (choice.kind === "invalid") {
    return choice.message;
  }

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
    console.error(`business image upload failed: ${uploadError.message}`);
    return "image_failed";
  }

  const patch = kind === "logo" ? { logo_path: path } : { cover_path: path };
  const { error } = await supabase.from("businesses").update(patch).eq("id", businessId);
  if (error) {
    console.error(`business image record failed: ${error.message}`);
    await removeStoredObject(supabase, businessId, path);
    return "image_failed";
  }

  if (previousPath && previousPath !== path) {
    await removeStoredObject(supabase, businessId, previousPath);
  }

  return null;
}

async function insertBusiness(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  ownerId: string,
  businessId: string,
  data: Parameters<typeof profilePayload>[0],
  slugWasProvided: boolean,
): Promise<{ ok: true } | { ok: false; message: BusinessMessageCode }> {
  const tried = new Set<string>();
  let slug = data.slug;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.from("businesses").insert({
      id: businessId,
      owner_id: ownerId,
      status: "draft",
      is_published: false,
      ...profilePayload({ ...data, slug }),
    });

    if (!error) {
      return { ok: true };
    }

    if (error.message.includes("business_limit")) {
      return { ok: false, message: "plan_limit" };
    }

    if (error.code !== "23505") {
      return { ok: false, message: "save_failed" };
    }

    if (slugWasProvided) {
      return { ok: false, message: "slug_taken" };
    }

    tried.add(slug);
    const next = uniqueSlug(data.slug, (candidate) => tried.has(candidate));
    if (tried.has(next)) {
      return { ok: false, message: "slug_taken" };
    }

    slug = next;
  }

  return { ok: false, message: "slug_taken" };
}

export async function saveBusinessAction(
  _state: BusinessFormState = idleBusinessState,
  formData: FormData,
): Promise<BusinessFormState> {
  const values = readBusinessFormValues(formRecord(formData));
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return failure("save_failed", values);
  }

  const parsed = parseBusinessForm(formRecord(formData));
  if (!parsed.ok) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return failure("not_found", values);
  }

  const limit = businessRateLimiter.consume(
    `business-write:${await requestIp()}`,
    businessRateLimits.write,
  );
  if (!limit.ok) {
    return failure("rate_limited", values);
  }

  const supabase = await sessionClient();
  if (!supabase) {
    return failure("unconfigured", values);
  }

  const requestedId = formData.get("businessId");
  const existingId = requestedId ? parseBusinessId(requestedId) : null;
  if (requestedId && !existingId) {
    return failure("not_found", values);
  }

  const logo = imageChoice(formData.get("logo"), formData.get("removeLogo") === "on");
  const cover = imageChoice(formData.get("cover"), formData.get("removeCover") === "on");
  if (logo.kind === "invalid") {
    return failure(logo.message, values);
  }
  if (cover.kind === "invalid") {
    return failure(cover.message, values);
  }

  let businessId = existingId;
  let previousLogo: string | null = null;
  let previousCover: string | null = null;
  let previousSlug: string | null = null;

  if (existingId) {
    const current = await getMyBusiness(existingId);
    if (!current || current.id !== existingId) {
      return failure("not_found", values);
    }

    if (!canEditBusiness(current.role)) {
      return failure("forbidden", values);
    }

    previousLogo = current.logoPath;
    previousCover = current.coverPath;
    previousSlug = current.slug;
    const { error } = await supabase
      .from("businesses")
      .update(profilePayload(parsed.data))
      .eq("id", existingId);

    if (error) {
      return failure(error.code === "23505" ? "slug_taken" : "save_failed", values, {
        slug: error.code === "23505" ? "slug_taken" : undefined,
      });
    }
  } else {
    try {
      const allowed = await canAddBusiness(user.id);
      if (!allowed) {
        return failure("plan_limit", values);
      }
    } catch (error) {
      if (error instanceof EnvConfigError) {
        return failure("unconfigured", values);
      }
      return failure("save_failed", values);
    }

    businessId = crypto.randomUUID();
    const created = await insertBusiness(
      supabase,
      user.id,
      businessId,
      parsed.data,
      values.slug.length > 0,
    );
    if (!created.ok) {
      return failure(created.message, values, created.message === "slug_taken" ? { slug: "slug_taken" } : undefined);
    }
  }

  if (!businessId) {
    return failure("save_failed", values);
  }

  const logoError = await storeImage(supabase, businessId, "logo", logo, previousLogo);
  const coverError = logoError
    ? null
    : await storeImage(supabase, businessId, "cover", cover, previousCover);
  const imageError = logoError ?? coverError;

  revalidatePath(`/${locale}/dashboard`);
  refreshPublicMenu(parsed.data.slug);
  if (previousSlug && previousSlug !== parsed.data.slug) {
    refreshPublicMenu(previousSlug);
  }

  if (imageError && !existingId) {
    redirect(`/${locale}/dashboard/businesses/${businessId}/settings?notice=${imageError}`);
  }

  if (imageError) {
    return failure(imageError, values);
  }

  redirect(
    existingId
      ? `/${locale}/dashboard/businesses/${businessId}/settings?notice=saved`
      : `/${locale}/dashboard/businesses/${businessId}?notice=created`,
  );
}

export async function deleteBusinessAction(
  _state: DeleteBusinessState,
  formData: FormData,
): Promise<DeleteBusinessState> {
  const locale = parseLocale(formData.get("locale"));
  const businessId = parseBusinessId(formData.get("businessId"));
  const confirmValue = formData.get("confirmSlug");
  const confirmSlug = typeof confirmValue === "string" ? confirmValue.trim() : "";
  if (!locale || !businessId) {
    return { status: "error", message: "not_found", confirmSlug };
  }

  const current = await getMyBusiness(businessId);
  if (!current) {
    return { status: "error", message: "not_found", confirmSlug };
  }

  if (!canDeleteBusiness(current.role)) {
    return { status: "error", message: "forbidden", confirmSlug };
  }

  if (confirmSlug !== current.slug) {
    return { status: "error", message: "confirm_mismatch", confirmSlug };
  }

  const limit = businessRateLimiter.consume(
    `business-delete:${await requestIp()}`,
    businessRateLimits.remove,
  );
  if (!limit.ok) {
    return { status: "error", message: "rate_limited", confirmSlug };
  }

  const supabase = await sessionClient();
  if (!supabase) {
    return { status: "error", message: "unconfigured", confirmSlug };
  }

  await removeStoredObject(supabase, current.id, current.logoPath);
  await removeStoredObject(supabase, current.id, current.coverPath);

  const { error } = await supabase.from("businesses").delete().eq("id", current.id);
  if (error) {
    return { status: "error", message: "save_failed", confirmSlug };
  }

  revalidatePath(`/${locale}/dashboard`);
  refreshPublicMenu(current.slug);
  redirect(`/${locale}/dashboard?notice=deleted`);
}

export async function publishMenuAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  const businessId = parseBusinessId(formData.get("businessId"));
  const destination = locale && businessId ? `/${locale}/dashboard/businesses/${businessId}` : "/";
  if (!locale || !businessId) {
    redirect(destination);
  }

  const current = await getMyBusiness(businessId);
  if (!current || !canEditBusiness(current.role)) {
    redirect(`${destination}?notice=forbidden`);
  }

  const limit = businessRateLimiter.consume(`business-publish:${await requestIp()}`, businessRateLimits.write);
  if (!limit.ok) {
    redirect(`${destination}?notice=rate_limited`);
  }

  const supabase = await sessionClient();
  if (!supabase) {
    redirect(`${destination}?notice=unconfigured`);
  }

  const existing = await supabase.from("businesses").select("status, suspended_at").eq("id", current.id).maybeSingle();
  if (existing.error || !existing.data || existing.data.suspended_at || existing.data.status === "archived") {
    redirect(`${destination}?notice=save_failed`);
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({ status: "active", is_published: true })
    .eq("id", current.id)
    .select("is_published");
  if (error || !data?.[0]?.is_published) {
    redirect(`${destination}?notice=save_failed`);
  }

  revalidatePath(destination);
  revalidatePath(`/${locale}/dashboard`);
  refreshPublicMenu(current.slug);
  redirect(`${destination}?notice=published`);
}
