import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/** Service-role client for platform administration. Bypasses RLS. */
export function createAdminClient() {
  return createAdminSupabaseClient();
}
