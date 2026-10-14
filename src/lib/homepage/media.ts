import { isHomepageImagePath } from "./schema";

export function homepageImageUrl(supabaseUrl: string, path: string): string | null {
  if (!isHomepageImagePath(path)) {
    return null;
  }
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/platform-media/${path}`;
}
