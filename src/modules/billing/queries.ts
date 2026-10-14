import "server-only";

import { connection } from "next/server";

import {
  analyticsVisibleFrom,
  resolveEntitlement,
  subscriptionStatuses,
  withinLimit,
  type Entitlement,
  type PlanLimits,
  type SubscriptionSnapshot,
  type SubscriptionStatus,
} from "@/lib/billing/entitlements";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const planColumns =
  "id, code, name, description, amount_cents, currency, is_active, max_businesses, max_products, max_themes, analytics_retention_days, custom_domains";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  is_active: boolean;
  max_businesses: number;
  max_products: number;
  max_themes: number;
  analytics_retention_days: number;
  custom_domains: boolean;
};

export type BusinessBilling = {
  subscriptionId: string | null;
  entitlement: Entitlement;
  subscription: SubscriptionSnapshot | null;
  requestedPlan: PlanLimits | null;
  plans: PlanLimits[];
  productCount: number;
  businessCount: number;
};

export type AccountBilling = BusinessBilling & {
  anchorBusinessId: string;
};

type AccountSubscription = {
  subscription_id: string;
  business_id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  requested_plan_id: string | null;
};

function toPlan(row: PlanRow): PlanLimits {
  return {
    code: row.code,
    name: row.name,
    description: row.description,
    amountCents: row.amount_cents,
    currency: row.currency,
    isActive: row.is_active,
    maxBusinesses: row.max_businesses,
    maxProducts: row.max_products,
    maxThemes: row.max_themes,
    analyticsRetentionDays: row.analytics_retention_days,
    customDomains: row.custom_domains,
  };
}

function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return subscriptionStatuses.includes(value as SubscriptionStatus);
}

function accountSnapshot(
  row: AccountSubscription | undefined,
  byId: Map<string, PlanLimits>,
): { subscriptionId: string | null; snapshot: SubscriptionSnapshot | null; requestedPlan: PlanLimits | null; anchorBusinessId: string | null } {
  if (!row || !isSubscriptionStatus(row.status)) {
    return { subscriptionId: null, snapshot: null, requestedPlan: null, anchorBusinessId: null };
  }
  const plan = byId.get(row.plan_id);
  if (!plan) {
    return { subscriptionId: null, snapshot: null, requestedPlan: null, anchorBusinessId: row.business_id };
  }
  return {
    subscriptionId: row.subscription_id,
    anchorBusinessId: row.business_id,
    requestedPlan: row.requested_plan_id ? byId.get(row.requested_plan_id) ?? null : null,
    snapshot: {
      status: row.status,
      planCode: plan.code,
      amountCents: plan.amountCents,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      requestedPlanCode: row.requested_plan_id ? byId.get(row.requested_plan_id)?.code ?? null : null,
    },
  };
}

async function loadAccountRow(businessId: string): Promise<AccountSubscription | null> {
  const supabase = await createServerSupabaseClient();
  const result = await supabase.rpc("account_subscription", { target_business_id: businessId });
  if (result.error) {
    throw result.error;
  }
  return result.data?.[0] ?? null;
}

export async function loadBusinessBilling(businessId: string, ownerId: string): Promise<BusinessBilling | null> {
  const supabase = await createServerSupabaseClient();
  const [plansResult, accountRow, productsResult, businessesResult] = await Promise.all([
    supabase.from("subscription_plans").select(planColumns).order("amount_cents"),
    loadAccountRow(businessId),
    supabase.from("menu_products").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", ownerId),
  ]);

  if (plansResult.error || productsResult.error || businessesResult.error) {
    throw plansResult.error ?? productsResult.error ?? businessesResult.error;
  }

  const plans = (plansResult.data ?? []).map((row) => ({ row, plan: toPlan(row) }));
  const byId = new Map(plans.map((entry) => [entry.row.id, entry.plan]));
  const account = accountSnapshot(accountRow ?? undefined, byId);
  const catalog = plans.map((entry) => entry.plan).filter((entry) => entry.isActive && entry.code !== "dev_starter" && entry.code !== "dev_growth");

  await connection();
  return {
    subscriptionId: account.subscriptionId,
    entitlement: resolveEntitlement(account.snapshot, plans.map((entry) => entry.plan), new Date()),
    subscription: account.snapshot,
    requestedPlan: account.requestedPlan,
    plans: catalog,
    productCount: productsResult.count ?? 0,
    businessCount: businessesResult.count ?? 0,
  };
}

export async function loadAccountBilling(ownerId: string): Promise<AccountBilling | null> {
  const supabase = await createServerSupabaseClient();
  const owned = await supabase.from("businesses").select("id").eq("owner_id", ownerId).order("created_at", { ascending: true });
  if (owned.error) {
    throw owned.error;
  }
  const businessIds = (owned.data ?? []).map((row) => row.id);
  if (businessIds.length === 0) {
    return null;
  }

  const [plansResult, accountRow] = await Promise.all([
    supabase.from("subscription_plans").select(planColumns).order("amount_cents"),
    loadAccountRow(businessIds[0]),
  ]);
  if (plansResult.error) {
    throw plansResult.error;
  }

  const plans = (plansResult.data ?? []).map((row) => ({ row, plan: toPlan(row) }));
  const byId = new Map(plans.map((entry) => [entry.row.id, entry.plan]));
  const account = accountSnapshot(accountRow ?? undefined, byId);
  const catalog = plans.map((entry) => entry.plan).filter((entry) => entry.isActive && entry.code !== "dev_starter" && entry.code !== "dev_growth");

  await connection();
  return {
    anchorBusinessId: account.anchorBusinessId ?? businessIds[0],
    subscriptionId: account.subscriptionId,
    entitlement: resolveEntitlement(account.snapshot, plans.map((entry) => entry.plan), new Date()),
    subscription: account.snapshot,
    requestedPlan: account.requestedPlan,
    plans: catalog,
    productCount: 0,
    businessCount: businessIds.length,
  };
}

export async function businessPlanUsage(ownerId: string): Promise<{ used: number; limit: number; canAdd: boolean }> {
  const supabase = await createServerSupabaseClient();
  const [countResult, capacityResult] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", ownerId),
    supabase.rpc("owner_business_capacity", { target_owner: ownerId }),
  ]);
  if (countResult.error || capacityResult.error || capacityResult.data === null) {
    throw countResult.error ?? capacityResult.error ?? new Error("business capacity unavailable");
  }

  const used = countResult.count ?? 0;
  const limit = capacityResult.data;
  return { used, limit, canAdd: withinLimit(used, limit) };
}

export async function canAddBusiness(ownerId: string): Promise<boolean> {
  const usage = await businessPlanUsage(ownerId);
  return usage.canAdd;
}

export async function canAddProduct(businessId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const [countResult, limitResult] = await Promise.all([
    supabase.from("menu_products").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.rpc("business_product_limit", { target_business_id: businessId }),
  ]);
  if (countResult.error || limitResult.error || limitResult.data === null) {
    throw countResult.error ?? limitResult.error ?? new Error("product limit unavailable");
  }

  return withinLimit(countResult.count ?? 0, limitResult.data);
}

export async function themeIsAllowed(businessId: string, theme: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("theme_is_allowed", {
    target_business_id: businessId,
    theme,
  });
  if (error || data === null) {
    throw error ?? new Error("theme entitlement unavailable");
  }

  return data;
}

export async function entitledMenuTheme(businessId: string, storedTheme: string): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("entitled_menu_theme", {
    target_business_id: businessId,
    stored_theme: storedTheme,
  });
  if (error || !data) {
    throw error ?? new Error("menu theme entitlement unavailable");
  }

  return data;
}

export function analyticsStart(retentionDays: number, now = new Date()): Date {
  return analyticsVisibleFrom(retentionDays, now);
}

export type PaymentHistoryItem = {
  id: string;
  businessId: string;
  amountCents: number;
  currency: string;
  status: Database["public"]["Tables"]["payments"]["Row"]["status"];
  paidAt: string | null;
  createdAt: string;
  planName: string | null;
};

export async function loadPaymentHistory(businessId: string): Promise<PaymentHistoryItem[]> {
  return loadPaymentRows([businessId]);
}

export async function loadAccountPayments(ownerId: string): Promise<PaymentHistoryItem[]> {
  const supabase = await createServerSupabaseClient();
  const owned = await supabase.from("businesses").select("id").eq("owner_id", ownerId);
  if (owned.error) {
    throw owned.error;
  }
  const businessIds = (owned.data ?? []).map((row) => row.id);
  if (businessIds.length === 0) {
    return [];
  }
  return loadPaymentRows(businessIds);
}

async function loadPaymentRows(businessIds: string[]): Promise<PaymentHistoryItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, business_id, amount_cents, currency, status, paid_at, created_at, plan_id")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const planIds = [...new Set(rows.flatMap((row) => (row.plan_id ? [row.plan_id] : [])))];
  const names = new Map<string, string>();
  if (planIds.length > 0) {
    const plans = await supabase.from("subscription_plans").select("id, name").in("id", planIds);
    if (plans.error) {
      throw plans.error;
    }
    for (const plan of plans.data ?? []) {
      names.set(plan.id, plan.name);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    businessId: row.business_id,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    planName: row.plan_id ? names.get(row.plan_id) ?? null : null,
  }));
}
