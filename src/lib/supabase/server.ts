import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { getPublicEnv } from "@/lib/env/public";

import type { Database } from "./database.types";

/**
 * Session-scoped Supabase client for Server Components, Server Functions,
 * and Route Handlers. Tenant access is enforced by Postgres row-level security.
 * Create a new client for each request.
 */
export async function createServerSupabaseClient() {
  await connection();
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot always write cookies. src/proxy.ts
            // refreshes the session and writes the updated cookies.
          }
        },
      },
    },
  );
}
