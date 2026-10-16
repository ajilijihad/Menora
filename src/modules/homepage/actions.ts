"use server";

import { revalidatePath } from "next/cache";

import { imageExtension, maxImageBytes } from "@/lib/businesses/media";
import { refreshHomepageCache } from "@/lib/homepage/cache";
import { isHomepageImagePath, readHomepage } from "@/lib/homepage/schema";
import type { Json } from "@/lib/supabase/database.types";
import { requirePlatformAdmin } from "@/modules/admin/guard";

const bucket = "platform-media";

export type HomepageActionCode = "forbidden" | "invalid" | "failed" | "unconfigured" | "image_type" | "image_too_large";

export async function saveHomepageAction(payload: unknown): Promise<{ ok: true } | { ok: false; code: HomepageActionCode }> {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { ok: false, code: "forbidden" };
  }

  const parsed = readHomepage(payload);
  if (!parsed.valid) {
    return { ok: false, code: "invalid" };
  }

  const content = parsed.content as unknown as Json;
  const existing = await access.supabase.from("platform_homepage").select("singleton").eq("singleton", true).maybeSingle();
  if (existing.error) {
    return { ok: false, code: existing.error.message.includes("platform_homepage") ? "unconfigured" : "failed" };
  }

  const write = existing.data
    ? await access.supabase.from("platform_homepage").update({ content, updated_by: access.userId }).eq("singleton", true)
    : await access.supabase.from("platform_homepage").insert({ singleton: true, content, updated_by: access.userId });
  if (write.error) {
    console.error(`homepage save failed: ${write.error.message}`);
    return { ok: false, code: write.error.message.includes("platform_homepage") ? "unconfigured" : "failed" };
  }

  refreshHomepageCache();
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/favicon.ico");
  return { ok: true };
}

export async function uploadHomepageImageAction(formData: FormData): Promise<{ ok: true; path: string } | { ok: false; code: HomepageActionCode }> {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { ok: false, code: "forbidden" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, code: "image_type" };
  }
  if (file.size > maxImageBytes) {
    return { ok: false, code: "image_too_large" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) {
    return { ok: false, code: "image_type" };
  }
  const allowIcon = formData.get("kind") === "icon";
  const extension = imageExtension(file.type) ?? (allowIcon ? iconExtension(file, bytes) : null);
  if (!extension) {
    return { ok: false, code: "image_type" };
  }
  const contentType = extension === "jpg" ? "image/jpeg" : extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/x-icon";
  const path = `homepage/${crypto.randomUUID()}.${extension}`;
  const uploaded = await access.supabase.storage.from(bucket).upload(path, new Blob([bytes], { type: contentType }), {
    contentType,
    upsert: false,
  });
  if (uploaded.error) {
    console.error(`homepage image upload failed: ${uploaded.error.message}`);
    return { ok: false, code: "failed" };
  }
  return { ok: true, path };
}

export async function removeHomepageImageAction(path: string): Promise<{ ok: true } | { ok: false; code: HomepageActionCode }> {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { ok: false, code: "forbidden" };
  }
  if (!isHomepageImagePath(path)) {
    return { ok: false, code: "invalid" };
  }
  const removed = await access.supabase.storage.from(bucket).remove([path]);
  if (removed.error) {
    console.error(`homepage image remove failed: ${removed.error.message}`);
    return { ok: false, code: "failed" };
  }
  return { ok: true };
}

function iconExtension(file: File, bytes: Uint8Array): "png" | "ico" | null {
  const named = file.name.toLowerCase().endsWith(".ico") || file.type === "image/x-icon" || file.type === "image/vnd.microsoft.icon";
  if (!named) {
    return null;
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (bytes.length >= 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) {
    return "ico";
  }
  return null;
}
