import type { EmailOtpType } from "@supabase/supabase-js";

import { safeNextPath } from "./paths";

const emailOtpTypes = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const satisfies readonly EmailOtpType[];

export type AuthCallback =
  | { kind: "otp"; type: EmailOtpType; tokenHash: string; next: string }
  | { kind: "code"; code: string; next: string }
  | { kind: "invalid" };

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return emailOtpTypes.some((type) => type === value);
}

function fallbackNext(type: string | null): string {
  return type === "recovery" ? "/en/reset-password" : "/en/dashboard";
}

export function resolveAuthCallback(input: {
  tokenHash: string | null;
  type: string | null;
  code: string | null;
  next: string | null;
}): AuthCallback {
  const next = safeNextPath(input.next) ?? fallbackNext(input.type);

  if (input.tokenHash && isEmailOtpType(input.type)) {
    return { kind: "otp", type: input.type, tokenHash: input.tokenHash, next };
  }

  if (input.code && !input.code.includes(" ") && input.code.length <= 2048) {
    return { kind: "code", code: input.code, next };
  }

  return { kind: "invalid" };
}
