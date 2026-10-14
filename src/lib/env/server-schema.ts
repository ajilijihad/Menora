import "server-only";

import { z } from "zod";

import { publicEnvSchema } from "./public-schema";
import { requiredValue } from "./values";

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: requiredValue("Supabase service-role key"),
  PAYPAL_CLIENT_ID: requiredValue("PayPal client ID"),
  PAYPAL_CLIENT_SECRET: requiredValue("PayPal client secret"),
  PAYPAL_ENVIRONMENT: z.enum(["sandbox", "live"]),
  PAYPAL_LIVE_PAYMENTS: z.preprocess(
    (value) => (value === undefined || value === "" ? "false" : value),
    z.enum(["true", "false"]),
  ),
  PAYPAL_WEBHOOK_ID: z.string().trim().max(80).default(""),
  RESEND_API_KEY: requiredValue("Resend API key"),
  RESEND_FROM_EMAIL: z.string().trim().max(200).default(""),
  CRON_SECRET: z.string().trim().max(200).default(""),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
