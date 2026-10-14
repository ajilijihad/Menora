import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";

import { publicMediaUrl } from "./media";

export function businessMediaUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  try {
    return publicMediaUrl(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, path);
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return null;
    }

    throw error;
  }
}
