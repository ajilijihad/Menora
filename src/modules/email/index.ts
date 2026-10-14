import "server-only";

import { Resend } from "resend";

import { getServerEnv } from "@/lib/env/server";

export function createEmailClient() {
  const env = getServerEnv();
  return new Resend(env.RESEND_API_KEY);
}
