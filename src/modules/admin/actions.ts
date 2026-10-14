"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { adminPage, adminSearch, allowedFilter } from "@/lib/admin/list";
import { parseLocale } from "@/lib/auth/schemas";
import { isCurrencyCode } from "@/lib/menus/money";
import { refreshPublicMenu } from "@/lib/menus/refresh-public-menu";
import { refundCapturedPayment } from "@/modules/billing/paypal";

import { requirePlatformAdmin } from "./guard";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function noticePath(locale: string, path: string, notice: string): string {
  return `/${locale}/admin/${path}?notice=${notice}`;
}

function plansNotice(locale: string, notice: string, formData: FormData): string {
  const params = new URLSearchParams();
  params.set("notice", notice);
  const term = adminSearch(String(formData.get("q") ?? ""));
  const status = allowedFilter(String(formData.get("status") ?? ""), ["active", "draft"]);
  const currency = String(formData.get("currencyFilter") ?? "");
  const page = adminPage(String(formData.get("page") ?? ""));
  if (term) {
    params.set("q", term);
  }
  if (status !== "all") {
    params.set("status", status);
  }
  if (isCurrencyCode(currency)) {
    params.set("currency", currency);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return `/${locale}/admin/plans?${params.toString()}`;
}

function usersNotice(locale: string, notice: string, formData: FormData): string {
  const params = new URLSearchParams();
  params.set("notice", notice);
  const term = adminSearch(String(formData.get("q") ?? ""));
  const page = adminPage(String(formData.get("page") ?? ""));
  if (term) {
    params.set("q", term);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return `/${locale}/admin/users?${params.toString()}`;
}

function readBounded(value: FormDataEntryValue | null, min: number, max: number): number | null {
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

function rpcNotice(error: { code?: string; message?: string } | null): "invalid" | "forbidden" | "failed" | null {
  if (!error) {
    return null;
  }
  if (error.code === "23514") {
    return "invalid";
  }
  if (error.code === "42501") {
    return "forbidden";
  }
  return "failed";
}

async function refreshBusiness(access: Awaited<ReturnType<typeof requirePlatformAdmin>> & { ok: true }, businessId: string) {
  const business = await access.supabase.from("businesses").select("owner_id, slug").eq("id", businessId).maybeSingle();
  if (!business.data) {
    return;
  }
  const owned = await access.supabase.from("businesses").select("slug").eq("owner_id", business.data.owner_id);
  const slugs = new Set((owned.data ?? []).map((row) => row.slug));
  if (business.data.slug) {
    slugs.add(business.data.slug);
  }
  for (const slug of slugs) {
    refreshPublicMenu(slug);
  }
}

export async function savePlanFormAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return;
  }
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    redirect(plansNotice(locale, "forbidden", formData));
  }

  const planId = String(formData.get("planId") ?? "");
  const creating = planId.length === 0;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const amount = readBounded(formData.get("amountCents"), 0, 2_000_000_000);
  const currency = String(formData.get("currency") ?? "");
  const maxBusinesses = readBounded(formData.get("maxBusinesses"), 1, 100000);
  const maxProducts = readBounded(formData.get("maxProducts"), 1, 100000);
  const maxThemes = readBounded(formData.get("maxThemes"), 1, 5);
  const retention = readBounded(formData.get("analyticsRetentionDays"), 1, 3650);
  const reason = String(formData.get("reason") ?? "");
  if (
    (!creating && !uuidPattern.test(planId))
    || name.length < 1
    || amount === null
    || !isCurrencyCode(currency)
    || maxBusinesses === null
    || maxProducts === null
    || maxThemes === null
    || retention === null
    || reason.trim().length < 8
    || reason.length > 500
  ) {
    redirect(plansNotice(locale, "invalid", formData));
  }

  const saved = await access.supabase.rpc("admin_save_plan", {
    target_id: creating ? null : planId,
    target_code: code,
    target_name: name,
    target_description: description,
    target_amount: amount,
    target_currency: currency,
    target_active: formData.get("isActive") === "on",
    target_businesses: maxBusinesses,
    target_products: maxProducts,
    target_themes: maxThemes,
    target_retention: retention,
    target_domains: formData.get("customDomains") === "on",
    target_reason: reason,
  });
  const failure = rpcNotice(saved.error);
  revalidatePath(`/${locale}/admin/plans`);
  redirect(plansNotice(locale, failure ?? (creating ? "created" : "saved"), formData));
}

type SubscriptionAdjustState = {
  status: "idle" | "success" | "error";
  notice: "adjusted" | "invalid" | "forbidden" | "failed" | null;
  revision: string;
};

function adjustResult(
  status: SubscriptionAdjustState["status"],
  notice: SubscriptionAdjustState["notice"],
): SubscriptionAdjustState {
  return { status, notice, revision: crypto.randomUUID() };
}

export async function adjustSubscriptionFormAction(
  _state: SubscriptionAdjustState,
  formData: FormData,
): Promise<SubscriptionAdjustState> {
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return adjustResult("error", "invalid");
  }
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return adjustResult("error", "forbidden");
  }
  const subscriptionId = String(formData.get("subscriptionId") ?? "").trim();
  const operation = String(formData.get("operation") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (formData.get("confirm") !== "yes" || !uuidPattern.test(subscriptionId) || reason.trim().length < 8 || reason.length > 500) {
    return adjustResult("error", "invalid");
  }
  if (operation !== "activate" && operation !== "renew" && operation !== "expire" && operation !== "cancel") {
    return adjustResult("error", "invalid");
  }

  const current = await access.supabase.from("subscriptions").select("business_id").eq("id", subscriptionId).maybeSingle();
  const adjusted = await access.supabase.rpc("admin_adjust_subscription", {
    target_id: subscriptionId,
    target_operation: operation,
    target_reason: reason,
  });
  const failure = rpcNotice(adjusted.error);
  if (failure) {
    return adjustResult("error", failure);
  }
  if (current.data?.business_id) {
    await refreshBusiness(access, current.data.business_id);
  }
  revalidatePath(`/${locale}/admin/subscriptions`);
  return adjustResult("success", "adjusted");
}

export async function grantPlanFormAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return;
  }
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    redirect(usersNotice(locale, "forbidden", formData));
  }
  const businessId = String(formData.get("businessId") ?? "").trim();
  const planId = String(formData.get("planId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "");
  if ((confirm !== "yes" && confirm !== "on") || !uuidPattern.test(businessId) || !uuidPattern.test(planId)) {
    console.error("grant plan rejected", { confirm, businessId, planId, reasonLength: reason.length });
    redirect(usersNotice(locale, "invalid", formData));
  }
  if (reason.length < 8 || reason.length > 500) {
    redirect(usersNotice(locale, "reason_short", formData));
  }

  const granted = await access.supabase.rpc("admin_grant_plan", {
    target_business: businessId,
    target_plan: planId,
    target_reason: reason,
  });
  if (granted.error) {
    console.error("grant plan failed", granted.error.code, granted.error.message);
  }
  const failure = rpcNotice(granted.error);
  if (!failure) {
    await refreshBusiness(access, businessId);
  }
  revalidatePath(`/${locale}/admin/users`);
  revalidatePath(`/${locale}/admin/subscriptions`);
  revalidatePath(`/${locale}/dashboard`, "layout");
  redirect(usersNotice(locale, failure ?? "granted", formData));
}

export async function suspendBusinessFormAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return;
  }
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    redirect(noticePath(locale, "businesses", "forbidden"));
  }
  const businessId = String(formData.get("businessId") ?? "");
  const mode = String(formData.get("mode") ?? "");
  if (formData.get("confirm") !== "yes" || !uuidPattern.test(businessId) || (mode !== "suspend" && mode !== "reactivate")) {
    redirect(noticePath(locale, "businesses", "invalid"));
  }

  const updated = await access.supabase.rpc("admin_set_business_suspension", {
    target_id: businessId,
    target_suspended: mode === "suspend",
    target_reason: String(formData.get("reason") ?? ""),
  });
  const failure = rpcNotice(updated.error);
  if (!failure) {
    await refreshBusiness(access, businessId);
  }
  revalidatePath(`/${locale}/admin/businesses`);
  redirect(noticePath(locale, "businesses", failure ?? (mode === "suspend" ? "suspended" : "reactivated")));
}

export async function refundPaymentFormAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return;
  }
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    redirect(noticePath(locale, "payments", "forbidden"));
  }
  const paymentId = String(formData.get("paymentId") ?? "");
  if (formData.get("confirm") !== "yes" || !uuidPattern.test(paymentId)) {
    redirect(noticePath(locale, "payments", "invalid"));
  }

  const result = await refundCapturedPayment(paymentId);
  if (result !== "refunded") {
    redirect(noticePath(locale, "payments", result === "unconfigured" ? "unconfigured" : "failed"));
  }

  const noted = await access.supabase.rpc("admin_note_refund", {
    target_payment: paymentId,
    target_reason: String(formData.get("reason") ?? ""),
  });
  revalidatePath(`/${locale}/admin/payments`);
  redirect(noticePath(locale, "payments", noted.error ? "audit_failed" : "refunded"));
}
