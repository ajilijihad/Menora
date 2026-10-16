import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";

import { publicAvatarUrl } from "./avatar";

export function profileAvatarUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  try {
    return publicAvatarUrl(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, path);
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return null;
    }

    throw error;
  }
}
