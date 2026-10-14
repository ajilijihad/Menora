import { parseEnv } from "./parse";
import { publicEnvSchema, type PublicEnv } from "./public-schema";

function readPublicEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

let publicEnv: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  if (!publicEnv) {
    publicEnv = parseEnv(publicEnvSchema, readPublicEnv());
  }

  return publicEnv;
}

export function hasPublicSupabaseEnv(): boolean {
  return publicEnvSchema
    .pick({
      NEXT_PUBLIC_SUPABASE_URL: true,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: true,
    })
    .safeParse(readPublicEnv()).success;
}
