import "server-only";

import { parseEnv } from "./parse";
import { serverEnvSchema, type ServerEnv } from "./server-schema";

function readServerEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT,
    PAYPAL_LIVE_PAYMENTS: process.env.PAYPAL_LIVE_PAYMENTS,
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    CRON_SECRET: process.env.CRON_SECRET,
  };
}

let serverEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!serverEnv) {
    serverEnv = parseEnv(serverEnvSchema, readServerEnv());
  }

  return serverEnv;
}
