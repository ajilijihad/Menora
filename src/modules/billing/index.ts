import "server-only";

import { paypalApiBase } from "@/lib/billing/paypal";
import { getServerEnv } from "@/lib/env/server";

export type PayPalEnvironment = "sandbox" | "live";

export type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  environment: PayPalEnvironment;
  apiBaseUrl: string;
  livePayments: boolean;
  webhookId: string;
};

export function getPayPalConfig(): PayPalConfig {
  const env = getServerEnv();

  return {
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    environment: env.PAYPAL_ENVIRONMENT,
    apiBaseUrl: paypalApiBase(env.PAYPAL_ENVIRONMENT),
    livePayments: env.PAYPAL_LIVE_PAYMENTS === "true",
    webhookId: env.PAYPAL_WEBHOOK_ID,
  };
}
