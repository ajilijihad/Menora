import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";

import { menuImageUrl } from "./media";

export function menuPhotoUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  try {
    return menuImageUrl(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, path);
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return null;
    }
    throw error;
  }
}
