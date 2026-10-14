"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { clientIpFromForwarded } from "@/lib/auth/ip";
import { parseLocale } from "@/lib/auth/schemas";
import { buildMediaPath, imageExtension, isSafeMediaPath, maxImageBytes, publicMediaUrl } from "@/lib/businesses/media";
import { getPublicEnv } from "@/lib/env/public";
import { menuRateLimiter, menuRateLimits } from "@/lib/menus/rate-limit";
import type { PosterSaveState } from "@/lib/menus/poster-save";
import { posterSizeFromValue } from "@/lib/menus/qr-palette";

import { requireMenu } from "./menu-access";

const mediaBucket = "business-media";

export async function saveMenuPosterAction(_state: PosterSaveState, formData: FormData): Promise<PosterSaveState> {
  const locale = parseLocale(formData.get("locale"));
  const access = await requireMenu(String(formData.get("businessId") ?? ""));
  if (!locale || !access) {
    return { ok: false, message: "not_found" };
  }
  if (access.unconfigured || !access.supabase) {
    return { ok: false, message: "unconfigured" };
  }

  const size = posterSizeFromValue(formData.get("size"));
  const remove = formData.get("removeBackground") === "1";
  const entry = formData.get("background");
  const file = entry instanceof File && entry.size > 0 ? entry : null;
  if (file && file.size > maxImageBytes) {
    return { ok: false, message: "image_too_large" };
  }
  if (file && !imageExtension(file.type)) {
    return { ok: false, message: "image_type" };
  }

  const limit = menuRateLimiter.consume(`menu-write:${await requestIp()}`, menuRateLimits.write);
  if (!limit.ok) {
    return { ok: false, message: "rate_limited" };
  }

  const current = await access.supabase
    .from("businesses")
    .select("poster_background_path")
    .eq("id", access.business.id)
    .maybeSingle();
  if (current.error) {
    return { ok: false, message: missingPosterColumn(current.error.message) ? "poster_unready" : "save_failed" };
  }

  const previousPath = typeof current.data?.poster_background_path === "string" ? current.data.poster_background_path : null;
  let nextPath = remove ? null : previousPath;

  if (file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = imageSignature(bytes);
    const declared = imageExtension(file.type);
    if (!detected || detected !== declared) {
      return { ok: false, message: "image_type" };
    }
    if (bytes.byteLength > maxImageBytes) {
      return { ok: false, message: "image_too_large" };
    }

    const path = buildMediaPath(access.business.id, "poster", detected, crypto.randomUUID());
    if (!isSafeMediaPath(access.business.id, path, "poster")) {
      return { ok: false, message: "image_failed" };
    }

    const contentType = detected === "jpg" ? "image/jpeg" : detected === "png" ? "image/png" : "image/webp";
    const uploaded = await access.supabase.storage.from(mediaBucket).upload(path, new Blob([bytes], { type: contentType }), {
      contentType,
      upsert: false,
    });
    if (uploaded.error) {
      console.error(`poster background upload failed: ${uploaded.error.message}`);
      return { ok: false, message: "image_failed" };
    }
    nextPath = path;
  }

  const saved = await access.supabase
    .from("businesses")
    .update({ poster_size: size, poster_background_path: nextPath })
    .eq("id", access.business.id);
  if (saved.error) {
    if (nextPath && nextPath !== previousPath) {
      await access.supabase.storage.from(mediaBucket).remove([nextPath]);
    }
    console.error(`poster settings save failed: ${saved.error.message}`);
    return { ok: false, message: missingPosterColumn(saved.error.message) ? "poster_unready" : "save_failed" };
  }

  if (previousPath && previousPath !== nextPath && isSafeMediaPath(access.business.id, previousPath, "poster")) {
    await access.supabase.storage.from(mediaBucket).remove([previousPath]);
  }

  revalidatePath(`/${locale}/dashboard/businesses/${access.business.id}/menu/qr`);
  return {
    ok: true,
    size,
    backgroundUrl: publicMediaUrl(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, nextPath),
    token: Date.now(),
  };
}

function missingPosterColumn(message: string): boolean {
  return message.includes("poster_size") || message.includes("poster_background_path");
}

function imageSignature(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

async function requestIp() {
  const headerStore = await headers();
  return clientIpFromForwarded(headerStore.get("x-forwarded-for"), headerStore.get("x-real-ip"));
}
