"use server";

import { revalidatePath } from "next/cache";

import { imageExtension, maxImageBytes } from "@/lib/businesses/media";
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

  revalidatePath("/en");
  revalidatePath("/ar");
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
  const extension = imageExtension(file.type);
  if (!extension) {
    return { ok: false, code: "image_type" };
  }
  if (file.size > maxImageBytes) {
    return { ok: false, code: "image_too_large" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) {
    return { ok: false, code: "image_type" };
  }
  const path = `homepage/${crypto.randomUUID()}.${extension}`;
  const uploaded = await access.supabase.storage.from(bucket).upload(path, new Blob([bytes], { type: file.type }), {
    contentType: file.type,
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
