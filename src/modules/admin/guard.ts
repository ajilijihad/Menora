import "server-only";

import { canAccessAdmin } from "@/lib/auth/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/modules/auth";

export async function requirePlatformAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { ok: false as const, status: 401 as const };
  }

  const supabase = await createServerSupabaseClient();
  const result = await supabase.rpc("is_platform_admin");
  if (!canAccessAdmin({ userId: user.id, appointed: result.data === true })) {
    return { ok: false as const, status: 403 as const };
  }

  return { ok: true as const, userId: user.id, supabase };
}
