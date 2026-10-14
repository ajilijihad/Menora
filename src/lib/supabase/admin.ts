import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env/server";

import type { Database } from "./database.types";

/**
 * Service-role client. It bypasses row-level security.
 * Import it only from server modules that perform platform administration.
 */
export function createAdminSupabaseClient() {
  const env = getServerEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
