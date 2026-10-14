"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clientIpFromForwarded } from "@/lib/auth/ip";
import { isObfuscatedExistingUser, mapAuthError, publicForgotPasswordResult } from "@/lib/auth/errors";
import { idleAuthState, type AuthFormState } from "@/lib/auth/form-state";
import { profileUpdatePayload, signUpOptions } from "@/lib/auth/metadata";
import { sendWelcomeEmail } from "@/modules/email/account";
import type { MessageCode } from "@/lib/auth/messages";
import { authConfirmRedirect, safeNextPath } from "@/lib/auth/paths";
import { authRateLimiter, authRateLimits } from "@/lib/auth/rate-limit";
import {
  parseForgot,
  parseLocale,
  parseLogin,
  parseProfile,
  parseRegister,
  parseReset,
} from "@/lib/auth/schemas";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { getAuthenticatedUser } from "./index";

function failure(message: MessageCode, values?: AuthFormState["values"]): AuthFormState {
  return { status: "error", message, values };
}

function textValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function submittedValues(formData: FormData): AuthFormState["values"] {
  return {
    name: textValue(formData.get("name")),
    email: textValue(formData.get("email")),
    password: textValue(formData.get("password")),
    confirmPassword: textValue(formData.get("confirmPassword")),
    remember: formData.get("remember") === "1" ? "1" : "0",
  };
}

async function requestIp() {
  const headerStore = await headers();
  return clientIpFromForwarded(
    headerStore.get("x-forwarded-for"),
    headerStore.get("x-real-ip"),
  );
}

async function sessionClient() {
  try {
    return { supabase: await createServerSupabaseClient(), unconfigured: false };
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return { supabase: null, unconfigured: true };
    }

    throw error;
  }
}

export async function registerAction(
  _state: AuthFormState = idleAuthState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = submittedValues(formData);
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return failure("auth_failed", values);
  }

  const parsed = parseRegister({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.ok) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  const limit = authRateLimiter.consume(
    `register:${await requestIp()}`,
    authRateLimits.register,
  );
  if (!limit.ok) {
    return failure("rate_limited", values);
  }

  const { supabase, unconfigured } = await sessionClient();
  if (!supabase || unconfigured) {
    return failure("unconfigured", values);
  }

  let appUrl: string;
  try {
    appUrl = getPublicEnv().NEXT_PUBLIC_APP_URL;
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return failure("unconfigured", values);
    }
    throw error;
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: signUpOptions(
      parsed.data.name,
      authConfirmRedirect(appUrl, `/${locale}/dashboard`),
    ),
  });
  // Verification and password recovery stay on the Supabase Auth email flow.

  if (error) {
    return failure(mapAuthError(error), values);
  }

  if (isObfuscatedExistingUser(data.user)) {
    return failure("email_taken", values);
  }

  if (data.user?.id) {
    await sendWelcomeEmail({
      userId: data.user.id,
      email: parsed.data.email,
      accountName: parsed.data.name,
      locale,
    });
  }

  if (data.session) {
    const verified = await supabase.auth.getUser();
    if (verified.data.user) {
      await supabase
        .from("profiles")
        .update(profileUpdatePayload(parsed.data.name))
        .eq("id", verified.data.user.id);
    }
    redirect(`/${locale}/dashboard`);
  }

  redirect(`/${locale}/verify-email`);
}

export async function loginAction(
  _state: AuthFormState = idleAuthState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = submittedValues(formData);
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return failure("auth_failed", values);
  }

  const parsed = parseLogin({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.ok) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  const limit = authRateLimiter.consume(`login:${await requestIp()}`, authRateLimits.login);
  if (!limit.ok) {
    return failure("rate_limited", values);
  }

  const { supabase, unconfigured } = await sessionClient();
  if (!supabase || unconfigured) {
    return failure("unconfigured", values);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return failure(mapAuthError(error), values);
  }

  const next = safeNextPath(formData.get("next")) ?? `/${locale}/dashboard`;
  redirect(next);
}

export async function forgotPasswordAction(
  _state: AuthFormState = idleAuthState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = submittedValues(formData);
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return failure("auth_failed", values);
  }

  const parsed = parseForgot({ email: formData.get("email") });
  if (!parsed.ok) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  const limit = authRateLimiter.consume(`forgot:${await requestIp()}`, authRateLimits.forgot);
  if (!limit.ok) {
    return failure("rate_limited", values);
  }

  const { supabase, unconfigured } = await sessionClient();
  if (!supabase || unconfigured) {
    return failure("unconfigured", values);
  }

  let appUrl: string;
  try {
    appUrl = getPublicEnv().NEXT_PUBLIC_APP_URL;
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return failure("unconfigured", values);
    }
    throw error;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: authConfirmRedirect(appUrl, `/${locale}/reset-password`),
  });
  const result = publicForgotPasswordResult(error);

  if (result !== "success") {
    return failure(result, values);
  }

  const sent = new URLSearchParams({ sent: "1", to: parsed.data.email });
  redirect(`/${locale}/forgot-password?${sent}`);
}

export async function resetPasswordAction(
  _state: AuthFormState = idleAuthState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = submittedValues(formData);
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return failure("auth_failed", values);
  }

  const parsed = parseReset({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.ok) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  const limit = authRateLimiter.consume(`reset:${await requestIp()}`, authRateLimits.reset);
  if (!limit.ok) {
    return failure("rate_limited", values);
  }

  const { supabase, unconfigured } = await sessionClient();
  if (!supabase || unconfigured) {
    return failure("unconfigured", values);
  }

  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return failure("session_expired", values);
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return failure(mapAuthError(error), values);
  }

  redirect(`/${locale}/dashboard?notice=password_updated`);
}

export async function updateProfileAction(
  _state: AuthFormState = idleAuthState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = submittedValues(formData);
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return failure("auth_failed", values);
  }

  const parsed = parseProfile({ name: formData.get("name") });
  if (!parsed.ok) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  const limit = authRateLimiter.consume(
    `profile:${await requestIp()}`,
    authRateLimits.profile,
  );
  if (!limit.ok) {
    return failure("rate_limited", values);
  }

  const { supabase, unconfigured } = await sessionClient();
  if (!supabase || unconfigured) {
    return failure("unconfigured", values);
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard/profile`)}`);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(profileUpdatePayload(parsed.data.name))
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return failure("profile_failed", values);
  }

  if (!data) {
    return failure("profile_missing", values);
  }

  const metadataUpdate = await supabase.auth.updateUser({
    data: { full_name: parsed.data.name },
  });
  if (metadataUpdate.error) {
    console.error("Unable to sync the profile name to the auth account.");
  }

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/profile`);

  return { status: "success", message: "profile_saved", values };
}

export async function resendConfirmationAction(
  _state: AuthFormState = idleAuthState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = submittedValues(formData);
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return failure("auth_failed", values);
  }

  const parsed = parseForgot({ email: formData.get("email") });
  if (!parsed.ok) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  const limit = authRateLimiter.consume(`resend:${await requestIp()}`, authRateLimits.resend);
  if (!limit.ok) {
    return failure("rate_limited", values);
  }

  const { supabase, unconfigured } = await sessionClient();
  if (!supabase || unconfigured) {
    return failure("unconfigured", values);
  }

  let appUrl: string;
  try {
    appUrl = getPublicEnv().NEXT_PUBLIC_APP_URL;
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return failure("unconfigured", values);
    }
    throw error;
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: authConfirmRedirect(appUrl, `/${locale}/dashboard`),
    },
  });
  const result = publicForgotPasswordResult(error);

  if (result !== "success") {
    return failure(result, values);
  }

  return { status: "success", message: "check_email", values };
}

export async function signOutAction(formData: FormData) {
  const locale = parseLocale(formData.get("locale")) ?? "en";
  const { supabase } = await sessionClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect(`/${locale}`);
}
