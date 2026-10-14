"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { txtRecordMatches } from "@/lib/domains/dns";
import { normalizeHostname, registrablePlatformHost, verificationName } from "@/lib/domains/host";
import { EnvConfigError } from "@/lib/env/error";
import { appOrigin } from "@/lib/menus/public-url";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env/server";

function domainPath(locale: string, businessId: string, notice: string): string {
  return `/${locale}/dashboard/businesses/${businessId}/domain?notice=${notice}`;
}

async function registerHost(): Promise<boolean> {
  try {
    const env = getServerEnv();
    const origin = appOrigin(env.NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development");
    if (!origin) {
      return false;
    }
    const hostname = registrablePlatformHost(new URL(origin).hostname);
    if (!hostname) {
      return false;
    }
    const admin = createAdminSupabaseClient();
    const registered = await admin.rpc("register_platform_host", { target_hostname: hostname });
    if (registered.error) {
      console.error("platform host registration failed", registered.error.message);
      return false;
    }
    return true;
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return false;
    }
    throw error;
  }
}

export async function submitDomainAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const businessId = String(formData.get("businessId") ?? "");
  const hostname = normalizeHostname(String(formData.get("hostname") ?? ""));
  if (!hostname) {
    redirect(domainPath(locale, businessId, "invalid"));
  }

  if (!(await registerHost())) {
    redirect(domainPath(locale, businessId, "unconfigured"));
  }

  const supabase = await createServerSupabaseClient();
  const result = await supabase.rpc("submit_custom_domain", {
    target_business_id: businessId,
    target_hostname: hostname,
  });
  if (result.error) {
    redirect(domainPath(locale, businessId, noticeFor(result.error.message, result.error.code)));
  }

  revalidatePath(`/${locale}/dashboard/businesses/${businessId}/domain`);
  redirect(domainPath(locale, businessId, "submitted"));
}

export async function checkDomainAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const businessId = String(formData.get("businessId") ?? "");
  const domainId = String(formData.get("domainId") ?? "");
  const supabase = await createServerSupabaseClient();
  const started = await supabase.rpc("begin_domain_check", { target_id: domainId });
  if (started.error || !started.data || typeof started.data !== "object" || Array.isArray(started.data)) {
    redirect(domainPath(locale, businessId, started.error ? noticeFor(started.error.message, started.error.code) : "failed"));
  }

  const record = started.data as Record<string, unknown>;
  const hostname = typeof record.hostname === "string" ? record.hostname : "";
  const token = typeof record.token === "string" ? record.token : "";
  if (!hostname || !token) {
    redirect(domainPath(locale, businessId, "failed"));
  }

  const outcome = await txtRecordMatches(verificationName(hostname), token);
  if (outcome !== "match") {
    redirect(domainPath(locale, businessId, outcome === "mismatch" ? "mismatch" : outcome === "error" ? "dns_error" : "missing"));
  }

  try {
    const admin = createAdminSupabaseClient();
    const confirmed = await admin.rpc("confirm_custom_domain", {
      target_id: domainId,
      observed_token: token,
    });
    if (confirmed.error || confirmed.data !== "verified") {
      redirect(domainPath(locale, businessId, "failed"));
    }
  } catch (error) {
    if (error instanceof EnvConfigError) {
      redirect(domainPath(locale, businessId, "unconfigured"));
    }
    throw error;
  }

  revalidatePath(`/${locale}/dashboard/businesses/${businessId}/domain`);
  redirect(domainPath(locale, businessId, "verified"));
}

export async function removeDomainAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const businessId = String(formData.get("businessId") ?? "");
  const domainId = String(formData.get("domainId") ?? "");
  if (formData.get("confirm") !== "yes") {
    redirect(domainPath(locale, businessId, "confirm"));
  }

  const supabase = await createServerSupabaseClient();
  const removed = await supabase.from("custom_domains").delete().eq("id", domainId).eq("business_id", businessId);
  if (removed.error) {
    redirect(domainPath(locale, businessId, "failed"));
  }

  revalidatePath(`/${locale}/dashboard/businesses/${businessId}/domain`);
  redirect(domainPath(locale, businessId, "removed"));
}

function noticeFor(message: string, code: string | undefined): string {
  if (message.includes("custom_domain_locked")) {
    return "locked";
  }
  if (message.includes("hostname_taken")) {
    return "taken";
  }
  if (message.includes("domain_exists")) {
    return "exists";
  }
  if (message.includes("hostname_invalid") || message.includes("platform_host_unregistered")) {
    return message.includes("platform_host_unregistered") ? "unconfigured" : "invalid";
  }
  if (message.includes("rate_limited")) {
    return "rate_limited";
  }
  if (message.includes("forbidden") || code === "42501") {
    return "forbidden";
  }
  if (code === "23505") {
    return "taken";
  }
  return "failed";
}
