"use server";

import { revalidatePath } from "next/cache";

import { parseLocale } from "@/lib/auth/schemas";
import { planSelection } from "@/lib/billing/entitlements";
import { isCurrencyCode } from "@/lib/menus/money";
import { refreshPublicMenu } from "@/lib/menus/refresh-public-menu";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { EnvConfigError } from "@/lib/env/error";
import { requirePlatformAdmin } from "@/modules/admin/guard";
import { getAuthenticatedUser } from "@/modules/auth";
import { getMyBusiness } from "@/modules/businesses/queries";

export type BillingActionState = {
  status: "idle" | "error" | "success";
  message:
    | "requested"
    | "saved"
    | "activated"
    | "renewed"
    | "expired"
    | "canceled"
    | "plan_invalid"
    | "forbidden"
    | "not_found"
    | "unconfigured"
    | "save_failed";
};

function failed(message: BillingActionState["message"]): BillingActionState {
  return { status: "error", message };
}

function succeeded(message: BillingActionState["message"]): BillingActionState {
  return { status: "success", message };
}

function adminClient() {
  try {
    return createAdminSupabaseClient();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return null;
    }
    throw error;
  }
}

export async function requestPlanAction(_state: BillingActionState, formData: FormData): Promise<BillingActionState> {
  const locale = parseLocale(formData.get("locale"));
  const businessId = String(formData.get("businessId") ?? "");
  const planCode = String(formData.get("planCode") ?? "");
  if (!locale || !businessId || !planCode) {
    return failed("plan_invalid");
  }

  const business = await getMyBusiness(businessId);
  if (!business || business.role !== "owner") {
    return failed(business ? "forbidden" : "not_found");
  }

  const admin = adminClient();
  if (!admin) {
    return failed("unconfigured");
  }

  const [planResult, subscriptionResult] = await Promise.all([
    admin
      .from("subscription_plans")
      .select("id, code, name, description, amount_cents, currency, is_active, max_businesses, max_products, max_themes, analytics_retention_days, custom_domains")
      .eq("code", planCode)
      .maybeSingle(),
    admin
      .from("subscriptions")
      .select("id, status, plan_id, current_period_start, current_period_end, requested_plan_id")
      .eq("business_id", business.id)
      .in("status", ["pending", "active", "past_due"])
      .maybeSingle(),
  ]);
  if (planResult.error || subscriptionResult.error || !planResult.data || !subscriptionResult.data) {
    return failed("plan_invalid");
  }

  const currentPlan = await admin
    .from("subscription_plans")
    .select("code, amount_cents")
    .eq("id", subscriptionResult.data.plan_id)
    .maybeSingle();
  if (currentPlan.error || !currentPlan.data) {
    return failed("save_failed");
  }

  const decision = planSelection(
    {
      status: subscriptionResult.data.status,
      planCode: currentPlan.data.code,
      amountCents: currentPlan.data.amount_cents,
      currentPeriodStart: subscriptionResult.data.current_period_start,
      currentPeriodEnd: subscriptionResult.data.current_period_end,
      requestedPlanCode: null,
    },
    {
      code: planResult.data.code,
      name: planResult.data.name,
      description: planResult.data.description,
      amountCents: planResult.data.amount_cents,
      currency: planResult.data.currency,
      isActive: planResult.data.is_active,
      maxBusinesses: planResult.data.max_businesses,
      maxProducts: planResult.data.max_products,
      maxThemes: planResult.data.max_themes,
      analyticsRetentionDays: planResult.data.analytics_retention_days,
      customDomains: planResult.data.custom_domains,
    },
  );
  if (decision.kind === "unavailable") {
    return failed("plan_invalid");
  }

  if (decision.kind === "free") {
    const user = await getAuthenticatedUser();
    if (!user) {
      return failed("forbidden");
    }
    const canceled = await cancelAccountToFree(admin, user.id);
    if (!canceled) {
      return failed("save_failed");
    }
    await refreshOwnerMenus(admin, user.id);
    revalidatePath(`/${locale}/dashboard/billing`);
    revalidatePath(`/${locale}/dashboard`, "layout");
    return succeeded("saved");
  }

  const { error } = await admin
    .from("subscriptions")
    .update({ requested_plan_id: planResult.data.id })
    .eq("id", subscriptionResult.data.id);
  if (error) {
    return failed("save_failed");
  }

  revalidatePath(`/${locale}/dashboard/billing`);
  return succeeded("requested");
}

export async function cancelPaidPlanAction(_state: BillingActionState, formData: FormData): Promise<BillingActionState> {
  const locale = parseLocale(formData.get("locale"));
  const businessId = String(formData.get("businessId") ?? "");
  if (!locale || !businessId) {
    return failed("not_found");
  }

  const business = await getMyBusiness(businessId);
  const user = await getAuthenticatedUser();
  if (!user || !business || business.role !== "owner") {
    return failed(business ? "forbidden" : "not_found");
  }

  const admin = adminClient();
  if (!admin) {
    return failed("unconfigured");
  }

  const canceled = await cancelAccountToFree(admin, user.id);
  if (!canceled) {
    return failed("save_failed");
  }

  await refreshOwnerMenus(admin, user.id);
  revalidatePath(`/${locale}/dashboard/billing`);
  revalidatePath(`/${locale}/dashboard`, "layout");
  return succeeded("canceled");
}

function readBounded(value: FormDataEntryValue | null, min: number, max: number): number | null {
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

export async function savePlanAction(_state: BillingActionState, formData: FormData): Promise<BillingActionState> {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return failed("forbidden");
  }

  const planId = String(formData.get("planId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amount = readBounded(formData.get("amountCents"), 0, 2_000_000_000);
  const currency = String(formData.get("currency") ?? "");
  const maxBusinesses = readBounded(formData.get("maxBusinesses"), 1, 100000);
  const maxProducts = readBounded(formData.get("maxProducts"), 1, 100000);
  const maxThemes = readBounded(formData.get("maxThemes"), 1, 5);
  const retention = readBounded(formData.get("analyticsRetentionDays"), 1, 3650);
  const reason = String(formData.get("reason") ?? "");
  if (!planId || name.length < 1 || name.length > 120 || description.length > 2000 || reason.trim().length < 8) {
    return failed("plan_invalid");
  }
  if (amount === null || !isCurrencyCode(currency) || maxBusinesses === null || maxProducts === null || maxThemes === null || retention === null) {
    return failed("plan_invalid");
  }

  const existing = await access.supabase.from("subscription_plans").select("code").eq("id", planId).maybeSingle();
  if (existing.error || !existing.data) {
    return failed(existing.error ? "save_failed" : "not_found");
  }

  const saved = await access.supabase.rpc("admin_save_plan", {
    target_id: planId,
    target_code: existing.data.code,
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
  if (saved.error) {
    return failed(saved.error.code === "42501" ? "forbidden" : "save_failed");
  }

  const locale = parseLocale(formData.get("locale"));
  if (locale) {
    revalidatePath(`/${locale}/admin/plans`);
  }
  return succeeded("saved");
}

export async function subscriptionOperationAction(
  _state: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return failed("forbidden");
  }

  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const operation = String(formData.get("operation") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!subscriptionId || reason.trim().length < 8 || formData.get("confirm") !== "yes") {
    return failed("plan_invalid");
  }
  if (operation !== "activate" && operation !== "renew" && operation !== "expire" && operation !== "cancel") {
    return failed("plan_invalid");
  }

  const subscription = await access.supabase.from("subscriptions").select("business_id").eq("id", subscriptionId).maybeSingle();
  if (subscription.error || !subscription.data) {
    return failed(subscription.error ? "save_failed" : "not_found");
  }

  const adjusted = await access.supabase.rpc("admin_adjust_subscription", {
    target_id: subscriptionId,
    target_operation: operation,
    target_reason: reason,
  });
  if (adjusted.error) {
    return failed(adjusted.error.code === "42501" ? "forbidden" : "plan_invalid");
  }

  const business = await access.supabase.from("businesses").select("slug").eq("id", subscription.data.business_id).maybeSingle();
  if (business.data?.slug) {
    refreshPublicMenu(business.data.slug);
  }
  const locale = parseLocale(formData.get("locale"));
  if (locale) {
    revalidatePath(`/${locale}/admin/subscriptions`);
  }
  return succeeded(operation === "activate" ? "activated" : operation === "renew" ? "renewed" : operation === "expire" ? "expired" : "canceled");
}

async function refreshOwnerMenus(admin: ReturnType<typeof createAdminSupabaseClient>, ownerId: string) {
  const owned = await admin.from("businesses").select("slug").eq("owner_id", ownerId);
  for (const business of owned.data ?? []) {
    refreshPublicMenu(business.slug);
  }
}

async function cancelAccountToFree(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  ownerId: string,
): Promise<boolean> {
  const free = await admin.from("subscription_plans").select("id").eq("code", "free").eq("is_active", true).maybeSingle();
  const owned = await admin.from("businesses").select("id").eq("owner_id", ownerId);
  if (free.error || owned.error || !free.data) {
    return false;
  }
  const businessIds = (owned.data ?? []).map((row) => row.id);
  if (businessIds.length === 0) {
    return false;
  }

  const current = await admin
    .from("subscriptions")
    .select("id, business_id, plan_id")
    .in("business_id", businessIds)
    .in("status", ["pending", "active", "past_due"]);
  if (current.error) {
    return false;
  }
  const rows = current.data ?? [];
  const planIds = [...new Set(rows.map((row) => row.plan_id))];
  const plans = planIds.length === 0
    ? { data: [], error: null }
    : await admin.from("subscription_plans").select("id, amount_cents").in("id", planIds);
  if (plans.error) {
    return false;
  }
  const amounts = new Map((plans.data ?? []).map((plan) => [plan.id, plan.amount_cents]));
  const paid = rows.filter((row) => (amounts.get(row.plan_id) ?? 0) > 0);
  if (paid.length === 0) {
    if (rows.length === 0) {
      return true;
    }
    const cleared = await admin
      .from("subscriptions")
      .update({ requested_plan_id: null, status: "active", current_period_end: null })
      .in("id", rows.map((row) => row.id));
    return !cleared.error;
  }

  for (const row of paid) {
    const updated = await admin.from("subscriptions").update({ status: "canceled", requested_plan_id: null }).eq("id", row.id);
    if (updated.error) {
      return false;
    }
    const inserted = await admin.from("subscriptions").insert({
      business_id: row.business_id,
      plan_id: free.data.id,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: null,
    });
    if (inserted.error) {
      return false;
    }
  }
  return true;
}
