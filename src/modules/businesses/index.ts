import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/** User-scoped client for business records. Access is limited by RLS. */
export async function createBusinessesClient() {
  return createServerSupabaseClient();
}
