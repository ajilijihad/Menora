import { z } from "zod";

import { requiredValue } from "./values";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .url("Supabase URL must be a valid URL")
    .refine((value) => !value.includes("your-project"), {
      message: "Replace NEXT_PUBLIC_SUPABASE_URL with the project URL",
    }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requiredValue(
    "Supabase publishable key",
  ),
  NEXT_PUBLIC_APP_URL: z
    .url("Application URL must be a valid URL")
    .transform((value) => value.replace(/\/$/, "")),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
