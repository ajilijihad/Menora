export const messageCodes = [
  "name_required",
  "name_too_long",
  "email_invalid",
  "password_short",
  "password_long",
  "password_weak",
  "password_common",
  "password_mismatch",
  "invalid_credentials",
  "email_unconfirmed",
  "email_taken",
  "rate_limited",
  "unconfigured",
  "auth_failed",
  "profile_failed",
  "profile_missing",
  "profile_saved",
  "image_type",
  "image_too_large",
  "image_failed",
  "verify_failed",
  "session_expired",
  "password_updated",
  "reset_sent",
  "check_email",
] as const;

export type MessageCode = (typeof messageCodes)[number];

export function messageFromQuery(value: string | string[] | undefined): MessageCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return messageCodes.find((code) => code === raw) ?? null;
}
