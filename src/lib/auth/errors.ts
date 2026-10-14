import type { MessageCode } from "./messages";

type AuthFailure = {
  message: string;
  code?: string | null;
  status?: number | null;
};

function normalized(error: AuthFailure) {
  return {
    message: error.message.toLowerCase(),
    code: error.code?.toLowerCase() ?? "",
    status: error.status ?? 0,
  };
}

export function mapAuthError(error: AuthFailure): MessageCode {
  const { message, code } = normalized(error);

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "email_unconfirmed";
  }

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return "email_taken";
  }

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "invalid_credentials";
  }

  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    message.includes("rate limit")
  ) {
    return "rate_limited";
  }

  if (message.includes("password should be at least") || code === "weak_password") {
    return "password_short";
  }

  return "auth_failed";
}

export function publicForgotPasswordResult(error: AuthFailure | null): "success" | MessageCode {
  if (!error) {
    return "success";
  }

  const mapped = mapAuthError(error);
  if (mapped === "rate_limited") {
    return "rate_limited";
  }

  if ((error.status ?? 0) >= 500) {
    return "auth_failed";
  }

  return "success";
}

export function isObfuscatedExistingUser(
  user: { identities?: unknown[] | null } | null,
): boolean {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}
