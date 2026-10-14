import "server-only";

import { EnvConfigError } from "@/lib/env/error";
import { getServerEnv } from "@/lib/env/server";

export type EmailProviderStatus = "ready" | "missing_from" | "unconfigured";

export function emailProviderStatus(): EmailProviderStatus {
  try {
    const from = getServerEnv().RESEND_FROM_EMAIL.trim();
    return from ? "ready" : "missing_from";
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return "unconfigured";
    }
    throw error;
  }
}
