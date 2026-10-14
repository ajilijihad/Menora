import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env/public";

import type { Database } from "./database.types";

/**
 * Anonymous Supabase client for the public menu.
 * It does not read cookies, so a signed-in owner is not treated as a member
 * and row-level security returns only published rows.
 */
export function createPublicSupabaseClient() {
  const env = getPublicEnv();

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
