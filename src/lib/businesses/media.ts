export const maxImageBytes = 1_500_000;

const extensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ImageMime = keyof typeof extensions;
export type MediaKind = "logo" | "cover" | "poster";

const pathPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(logo|cover|poster)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export function imageExtension(mime: string): "jpg" | "png" | "webp" | null {
  if (mime in extensions) {
    return extensions[mime as ImageMime];
  }

  return null;
}

export function buildMediaPath(
  businessId: string,
  kind: MediaKind,
  extension: "jpg" | "png" | "webp",
  fileId: string,
): string {
  return `${businessId}/${kind}-${fileId}.${extension}`;
}

export function isSafeMediaPath(businessId: string, path: string, kind?: MediaKind): boolean {
  const normalized = path.toLowerCase();
  if (!pathPattern.test(normalized) || normalized.includes("..")) {
    return false;
  }

  if (!normalized.startsWith(`${businessId.toLowerCase()}/`)) {
    return false;
  }

  if (kind && !normalized.includes(`/${kind}-`)) {
    return false;
  }

  return true;
}

export function publicMediaUrl(supabaseUrl: string, path: string | null): string | null {
  if (!path || !isSafeMediaPath(path.split("/")[0] ?? "", path)) {
    return null;
  }

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/business-media/${path}`;
}
