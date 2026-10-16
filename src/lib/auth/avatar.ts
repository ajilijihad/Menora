const pathPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/avatar-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export const profileMediaBucket = "profile-media";

export function buildAvatarPath(userId: string, extension: "jpg" | "png" | "webp", fileId: string): string {
  return `${userId}/${"avatar"}-${fileId}.${extension}`.toLowerCase();
}

export function isSafeAvatarPath(userId: string, path: string): boolean {
  const normalized = path.toLowerCase();
  return pathPattern.test(normalized) && !normalized.includes("..") && normalized.startsWith(`${userId.toLowerCase()}/`);
}

export function publicAvatarUrl(supabaseUrl: string, path: string | null): string | null {
  if (!path || !isSafeAvatarPath(path.split("/")[0] ?? "", path)) {
    return null;
  }

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${profileMediaBucket}/${path}`;
}
