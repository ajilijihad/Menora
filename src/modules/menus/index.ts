import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/** User-scoped client for menu records. Access is limited by RLS. */
export async function createMenusClient() {
  return createServerSupabaseClient();
}
