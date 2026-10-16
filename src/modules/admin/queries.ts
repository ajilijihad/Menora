import "server-only";

import { adminListSize, adminPage, adminPageSize, adminSearch, allowedFilter, ilikeContains, pageRange } from "@/lib/admin/list";
import { countsByDay, dayList, monthlyRecurring, paymentSeries, paymentTotals, resolveAdminWindow, type AdminOverview } from "@/lib/admin/overview";
import { isCurrencyCode } from "@/lib/menus/money";
import { previousWindow } from "@/lib/analytics/present";

import { requirePlatformAdmin } from "./guard";

type Denied = { denied: true };
type Failed = { failed: true };

function orIlike(columns: string[], term: string): string {
  const pattern = `"${ilikeContains(term)}"`;
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}

async function exactCount(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number | null> {
  const result = await query;
  if (result.error) {
    return null;
  }
  return result.count ?? 0;
}

export async function loadAdminMetrics(): Promise<
  | Denied
  | Failed
  | {
      businesses: number;
      suspended: number;
      users: number;
      activeSubscriptions: number;
      pendingSubscriptions: number;
      expiredSubscriptions: number;
      completedPayments: number;
      failedEmails: number;
      domains: number;
      menuViews7d: number;
    }
> {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true };
  }
  const { supabase } = access;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [
    businesses,
    suspended,
    users,
    activeSubscriptions,
    pendingSubscriptions,
    expiredSubscriptions,
    completedPayments,
    failedEmails,
    domains,
    menuViews7d,
  ] = await Promise.all([
    exactCount(supabase.from("businesses").select("id", { count: "exact", head: true })),
    exactCount(supabase.from("businesses").select("id", { count: "exact", head: true }).not("suspended_at", "is", null)),
    exactCount(supabase.from("profiles").select("id", { count: "exact", head: true })),
    exactCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active")),
    exactCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "pending")),
    exactCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired")),
    exactCount(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "completed")),
    exactCount(supabase.from("email_logs").select("id", { count: "exact", head: true }).eq("status", "failed")),
    exactCount(supabase.from("custom_domains").select("id", { count: "exact", head: true })),
    exactCount(
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_name", "menu_view")
        .gte("occurred_at", since),
    ),
  ]);
  if (
    businesses === null
    || suspended === null
    || users === null
    || activeSubscriptions === null
    || pendingSubscriptions === null
    || expiredSubscriptions === null
    || completedPayments === null
    || failedEmails === null
    || domains === null
    || menuViews7d === null
  ) {
    return { failed: true };
  }
  return {
    businesses,
    suspended,
    users,
    activeSubscriptions,
    pendingSubscriptions,
    expiredSubscriptions,
    completedPayments,
    failedEmails,
    domains,
    menuViews7d,
  };
}

export async function loadRecentAudits() {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true as const };
  }
  const result = await access.supabase
    .from("admin_audit_logs")
    .select("id, action, target_table, target_id, reason, created_at, actor_id")
    .order("created_at", { ascending: false })
    .limit(8);
  if (result.error) {
    return { failed: true as const };
  }
  return { rows: result.data };
}

export async function loadAdminOverview(input: {
  range?: string;
  from?: string;
  to?: string;
  now: Date;
}): Promise<{ denied: true; status: 401 | 403 } | Failed | AdminOverview> {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true, status: access.status };
  }

  const window = resolveAdminWindow(input, input.now);
  const previous = previousWindow(window.from, window.to);
  const previousStart = previous ? `${previous.from}T00:00:00.000Z` : window.start;
  const previousEnd = window.start;
  const days = dayList(window.from, window.to);
  const { supabase, userId } = access;

  const [
    businesses,
    activeBusinesses,
    users,
    activeSubscriptions,
    pendingSubscriptions,
    expiredSubscriptions,
    pastDueSubscriptions,
    canceledSubscriptions,
    failedEmailBacklog,
    pendingDomains,
    failedPayments,
    businessWindow,
    previousBusinesses,
    userWindow,
    previousUsers,
    emailWindow,
    previousEmails,
    paymentWindow,
    previousPayments,
    audits,
  ] = await Promise.all([
    exactCount(supabase.from("businesses").select("id", { count: "exact", head: true })),
    exactCount(
      supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "active").is("suspended_at", null),
    ),
    exactCount(supabase.from("profiles").select("id", { count: "exact", head: true })),
    exactCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active")),
    exactCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "pending")),
    exactCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired")),
    exactCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "past_due")),
    exactCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "canceled")),
    exactCount(supabase.from("email_logs").select("id", { count: "exact", head: true }).eq("status", "failed")),
    exactCount(supabase.from("custom_domains").select("id", { count: "exact", head: true }).eq("status", "pending")),
    exactCount(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "failed")),
    supabase
      .from("businesses")
      .select("created_at", { count: "exact" })
      .gte("created_at", window.start)
      .lt("created_at", window.end)
      .limit(1000),
    exactCount(
      supabase.from("businesses").select("id", { count: "exact", head: true }).gte("created_at", previousStart).lt("created_at", previousEnd),
    ),
    supabase
      .from("profiles")
      .select("created_at", { count: "exact" })
      .gte("created_at", window.start)
      .lt("created_at", window.end)
      .limit(1000),
    exactCount(
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", previousStart).lt("created_at", previousEnd),
    ),
    supabase
      .from("email_logs")
      .select("created_at", { count: "exact" })
      .eq("status", "failed")
      .gte("created_at", window.start)
      .lt("created_at", window.end)
      .limit(1000),
    exactCount(
      supabase
        .from("email_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", previousStart)
        .lt("created_at", previousEnd),
    ),
    supabase
      .from("payments")
      .select("amount_cents, currency, paid_at", { count: "exact" })
      .eq("status", "completed")
      .not("paid_at", "is", null)
      .gte("paid_at", window.start)
      .lt("paid_at", window.end)
      .limit(1000),
    supabase
      .from("payments")
      .select("amount_cents, currency, paid_at", { count: "exact" })
      .eq("status", "completed")
      .not("paid_at", "is", null)
      .gte("paid_at", previousStart)
      .lt("paid_at", previousEnd)
      .limit(1000),
    supabase
      .from("admin_audit_logs")
      .select("id, action, reason, created_at, actor_id")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (
    businesses === null
    || activeBusinesses === null
    || users === null
    || activeSubscriptions === null
    || pendingSubscriptions === null
    || expiredSubscriptions === null
    || pastDueSubscriptions === null
    || canceledSubscriptions === null
    || failedEmailBacklog === null
    || pendingDomains === null
    || failedPayments === null
    || businessWindow.error
    || userWindow.error
    || emailWindow.error
    || paymentWindow.error
    || businessWindow.count === null
    || userWindow.count === null
    || emailWindow.count === null
    || paymentWindow.count === null
  ) {
    return { failed: true };
  }

  const businessStamps = businessWindow.data?.map((row) => row.created_at) ?? [];
  const userStamps = userWindow.data?.map((row) => row.created_at) ?? [];
  const emailStamps = emailWindow.data?.map((row) => row.created_at) ?? [];
  const businessComplete = businessStamps.length >= businessWindow.count;
  const userComplete = userStamps.length >= userWindow.count;
  const emailComplete = emailStamps.length >= emailWindow.count;
  const paymentRows = paymentWindow.data ?? [];
  const paymentComplete = paymentRows.length >= paymentWindow.count;
  const payment = paymentComplete ? paymentTotals(paymentRows) : { totals: [], reliable: false };
  const previousPaymentRows = previousPayments.error || previousPayments.count === null || (previousPayments.data?.length ?? 0) < previousPayments.count
    ? null
    : paymentTotals(previousPayments.data ?? []);

  let activity: AdminOverview["activity"] = null;
  if (!audits.error && audits.data) {
    const actorIds = [...new Set(audits.data.map((row) => row.actor_id))];
    const actors = actorIds.length === 0
      ? { data: [], error: null }
      : await supabase.from("profiles").select("id, full_name").in("id", actorIds);
    const names = actors.error
      ? new Map<string, string>()
      : new Map((actors.data ?? []).map((actor) => [actor.id, actor.full_name?.trim() || ""]));
    activity = audits.data.map((row) => ({
      id: row.id,
      action: row.action,
      reason: row.reason,
      createdAt: row.created_at,
      actor: names.get(row.actor_id) || "",
      self: row.actor_id === userId,
    }));
  }

  const revenue = payment.reliable ? payment.totals : null;
  const revenueCurrency = revenue?.length === 1 ? revenue[0]?.currency : null;

  return {
    preset: window.preset,
    from: window.from,
    to: window.to,
    businesses,
    activeBusinesses,
    users,
    subscriptions: {
      active: activeSubscriptions,
      pending: pendingSubscriptions,
      past_due: pastDueSubscriptions,
      expired: expiredSubscriptions,
      canceled: canceledSubscriptions,
    },
    newBusinesses: businessWindow.count,
    previousNewBusinesses: previousBusinesses,
    newUsers: userWindow.count,
    previousNewUsers: previousUsers,
    failedEmails: emailWindow.count,
    previousFailedEmails: previousEmails,
    failedEmailBacklog,
    pendingDomains,
    failedPayments,
    days,
    businessSeries: businessComplete ? countsByDay(days, businessStamps) : null,
    userSeries: userComplete ? countsByDay(days, userStamps) : null,
    emailSeries: emailComplete ? countsByDay(days, emailStamps) : null,
    revenue,
    previousRevenue: previousPaymentRows?.reliable ? previousPaymentRows.totals : null,
    revenueSeries: revenueCurrency ? paymentSeries(days, paymentRows, revenueCurrency) : null,
    activity,
  };
}

export async function loadBusinesses(input: { q?: string; status?: string; page?: string }) {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true as const };
  }
  const term = adminSearch(input.q);
  const status = allowedFilter(input.status, ["draft", "active", "archived", "suspended"]);
  const page = adminPage(input.page);
  const range = pageRange(page);
  let query = access.supabase
    .from("businesses")
    .select("id, name, slug, status, is_published, suspended_at, owner_id, logo_path, created_at", { count: "exact" });
  if (status === "suspended") {
    query = query.not("suspended_at", "is", null);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }
  if (term) {
    query = query.or(orIlike(["name", "slug"], term));
  }
  const result = await query.order("created_at", { ascending: false }).range(range.from, range.to);
  if (result.error) {
    return { failed: true as const };
  }
  const ownerIds = [...new Set(result.data.map((row) => row.owner_id))];
  const owners = ownerIds.length === 0
    ? { data: [], error: null }
    : await access.supabase.from("profiles").select("id, email, full_name").in("id", ownerIds);
  if (owners.error) {
    return { failed: true as const };
  }
  const ownerById = new Map((owners.data ?? []).map((owner) => [owner.id, owner]));
  return {
    rows: result.data.map((row) => ({ ...row, owner: ownerById.get(row.owner_id) ?? null })),
    total: result.count ?? 0,
    page,
    term,
    status,
    pageSize: adminPageSize,
  };
}

export async function loadUsers(input: { q?: string; page?: string }) {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true as const };
  }
  const term = adminSearch(input.q);
  const page = adminPage(input.page);
  const range = pageRange(page);
  let query = access.supabase.from("profiles").select("id, email, full_name, avatar_path, created_at", { count: "exact" });
  if (term) {
    query = query.or(orIlike(["email", "full_name"], term));
  }
  const result = await query.order("created_at", { ascending: false }).range(range.from, range.to);
  if (result.error) {
    return { failed: true as const };
  }
  const ids = result.data.map((row) => row.id);
  const appointed = ids.length === 0
    ? { data: [], error: null }
    : await access.supabase.from("platform_admins").select("user_id").in("user_id", ids);
  if (appointed.error) {
    return { failed: true as const };
  }
  const appointedIds = new Set((appointed.data ?? []).map((row) => row.user_id));
  const businesses = ids.length === 0
    ? { data: [], error: null }
    : await access.supabase.from("businesses").select("id, name, owner_id, logo_path").in("owner_id", ids);
  if (businesses.error) {
    return { failed: true as const };
  }
  const businessIds = (businesses.data ?? []).map((business) => business.id);
  const [subscriptions, plans] = await Promise.all([
    businessIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : access.supabase
          .from("subscriptions")
          .select("business_id, plan_id, status, current_period_end")
          .in("business_id", businessIds)
          .in("status", ["pending", "active", "past_due"]),
    access.supabase.from("subscription_plans").select("id, name, amount_cents, currency, is_active").order("amount_cents"),
  ]);
  if (subscriptions.error || plans.error) {
    return { failed: true as const };
  }
  const subscriptionByBusiness = new Map((subscriptions.data ?? []).map((row) => [row.business_id, row]));
  const planById = new Map((plans.data ?? []).map((plan) => [plan.id, plan]));
  const businessesByOwner = new Map<string, Array<{
    id: string;
    name: string;
    logoPath: string | null;
    planId: string | null;
    planName: string | null;
    planAmount: number | null;
    planCurrency: string | null;
    status: "pending" | "active" | "past_due" | null;
  }>>();
  for (const business of businesses.data ?? []) {
    const subscription = subscriptionByBusiness.get(business.id);
    const plan = subscription ? planById.get(subscription.plan_id) : undefined;
    const status = subscription?.status === "pending" || subscription?.status === "active" || subscription?.status === "past_due"
      ? subscription.status
      : null;
    const entry = {
      id: business.id,
      name: business.name,
      logoPath: business.logo_path,
      planId: plan?.id ?? null,
      planName: plan?.name ?? null,
      planAmount: plan?.amount_cents ?? null,
      planCurrency: plan?.currency ?? null,
      status,
    };
    const current = businessesByOwner.get(business.owner_id) ?? [];
    current.push(entry);
    businessesByOwner.set(business.owner_id, current);
  }
  return {
    rows: result.data.map((row) => ({
      ...row,
      appointed: appointedIds.has(row.id),
      businesses: businessesByOwner.get(row.id) ?? [],
    })),
    plans: (plans.data ?? [])
      .filter((plan) => plan.is_active)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        amountCents: plan.amount_cents,
        currency: plan.currency,
      })),
    total: result.count ?? 0,
    page,
    term,
    pageSize: adminPageSize,
  };
}

export async function loadPlans(input: { q?: string; page?: string; status?: string; currency?: string }) {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true as const };
  }
  const term = adminSearch(input.q);
  const status = allowedFilter(input.status, ["active", "draft"]);
  const currency = isCurrencyCode(input.currency ?? "") ? input.currency ?? "" : "";
  const page = adminPage(input.page);
  const range = pageRange(page);
  const filtered = () => {
    let query = access.supabase.from("subscription_plans").select("id", { count: "exact", head: true });
    if (term) {
      query = query.or(orIlike(["name", "code"], term));
    }
    if (currency) {
      query = query.eq("currency", currency);
    }
    return query;
  };
  let pageQuery = access.supabase
    .from("subscription_plans")
    .select("id, code, name, description, amount_cents, currency, is_active, max_businesses, max_products, max_themes, analytics_retention_days, custom_domains", { count: "exact" });
  if (term) {
    pageQuery = pageQuery.or(orIlike(["name", "code"], term));
  }
  if (currency) {
    pageQuery = pageQuery.eq("currency", currency);
  }
  if (status === "active") {
    pageQuery = pageQuery.eq("is_active", true);
  }
  if (status === "draft") {
    pageQuery = pageQuery.eq("is_active", false);
  }
  const [allCount, activeCount, draftCount, result] = await Promise.all([
    exactCount(filtered()),
    exactCount(filtered().eq("is_active", true)),
    exactCount(filtered().eq("is_active", false)),
    pageQuery.order("amount_cents", { ascending: true }).range(range.from, range.to),
  ]);
  if (result.error || allCount === null || activeCount === null || draftCount === null) {
    return { failed: true as const };
  }
  return {
    rows: result.data,
    total: result.count ?? 0,
    page,
    term,
    status,
    currency,
    counts: { all: allCount, active: activeCount, draft: draftCount },
    pageSize: adminPageSize,
  };
}

export async function loadPlanSummary() {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true as const };
  }
  const { supabase } = access;
  const [activePlans, subscriptionRows, plans] = await Promise.all([
    exactCount(supabase.from("subscription_plans").select("id", { count: "exact", head: true }).eq("is_active", true)),
    supabase.from("subscriptions").select("plan_id, current_period_end", { count: "exact" }).eq("status", "active").limit(1000),
    supabase.from("subscription_plans").select("id, amount_cents, currency"),
  ]);
  if (plans.error) {
    return { failed: true as const };
  }
  const currencies = [...new Set((plans.data ?? []).map((plan) => plan.currency))].filter(isCurrencyCode).sort();
  const planById = new Map((plans.data ?? []).map((plan) => [plan.id, plan]));
  const complete = !subscriptionRows.error && subscriptionRows.count !== null && (subscriptionRows.data ?? []).length >= subscriptionRows.count;
  const now = Date.now();
  const current = complete
    ? (subscriptionRows.data ?? []).filter((row) => {
        if (!row.current_period_end) {
          return true;
        }
        const end = new Date(row.current_period_end).getTime();
        return Number.isFinite(end) && end > now;
      })
    : [];
  const priced = current.flatMap((row) => {
    const plan = planById.get(row.plan_id);
    return plan ? [{ amountCents: plan.amount_cents, currency: plan.currency }] : [];
  });
  const missingPlan = current.some((row) => !planById.has(row.plan_id));
  return {
    activePlans,
    subscribers: complete ? current.length : null,
    revenue: monthlyRecurring(priced, complete && !missingPlan),
    currencies,
  };
}

const subscriptionUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const subscriptionStatuses = ["pending", "active", "past_due", "expired", "canceled"] as const;
type AccountSubscriptionStatus = (typeof subscriptionStatuses)[number];

type StoredSubscription = {
  id: string;
  business_id: string;
  plan_id: string;
  status: AccountSubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

type AccountSubscription = {
  id: string;
  accountSubscriptionId: string;
  status: AccountSubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
  updatedAt: number;
  ownerId: string;
  recordIds: string[];
  account: { name: string; email: string; businessCount: number };
  plan: { name: string; code: string } | null;
  businessNames: string[];
  current: boolean;
};

function subscriptionIsCurrent(row: StoredSubscription, planActive: boolean, now: number): boolean {
  if (row.status !== "active" || !planActive) {
    return false;
  }
  if (!row.current_period_end) {
    return true;
  }
  const end = new Date(row.current_period_end).getTime();
  return Number.isFinite(end) && end > now;
}

async function readPages<T>(
  read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[] | null> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; from < 5000; from += pageSize) {
    const result = await read(from, from + pageSize - 1);
    if (result.error || !result.data) {
      return null;
    }
    rows.push(...result.data);
    if (result.data.length < pageSize) {
      return rows;
    }
  }
  return null;
}

async function loadAccountSubscriptions(
  supabase: Awaited<ReturnType<typeof requirePlatformAdmin>> & { ok: true },
): Promise<AccountSubscription[] | null> {
  const client = supabase.supabase;
  const [businesses, plans, subscriptions] = await Promise.all([
    readPages((from, to) => client.from("businesses").select("id, name, owner_id").order("id").range(from, to)),
    readPages((from, to) => client.from("subscription_plans").select("id, name, code, amount_cents, is_active").order("id").range(from, to)),
    readPages((from, to) =>
      client
        .from("subscriptions")
        .select("id, business_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at")
        .order("id")
        .range(from, to),
    ),
  ]);
  if (!businesses || !plans || !subscriptions) {
    return null;
  }
  const ownerIds = [...new Set(businesses.map((row) => row.owner_id))];
  const profiles: { id: string; email: string | null; full_name: string }[] = [];
  for (let index = 0; index < ownerIds.length; index += 200) {
    const chunk = ownerIds.slice(index, index + 200);
    const result = await client.from("profiles").select("id, email, full_name").in("id", chunk);
    if (result.error || !result.data) {
      return null;
    }
    profiles.push(...result.data);
  }
  const planById = new Map(plans.map((row) => [row.id, row]));
  const profileById = new Map(profiles.map((row) => [row.id, row]));
  const namesByOwner = new Map<string, string[]>();
  const ownerByBusiness = new Map<string, string>();
  for (const business of businesses) {
    ownerByBusiness.set(business.id, business.owner_id);
    const names = namesByOwner.get(business.owner_id) ?? [];
    names.push(business.name);
    namesByOwner.set(business.owner_id, names);
  }
  const byOwner = new Map<string, StoredSubscription[]>();
  for (const row of subscriptions) {
    const ownerId = ownerByBusiness.get(row.business_id);
    if (!ownerId || !subscriptionStatuses.includes(row.status)) {
      continue;
    }
    const current = byOwner.get(ownerId) ?? [];
    current.push(row);
    byOwner.set(ownerId, current);
  }
  const now = Date.now();
  const accounts: AccountSubscription[] = [];
  for (const [ownerId, rows] of byOwner) {
    const currentRows = rows.filter((row) => subscriptionIsCurrent(row, planById.get(row.plan_id)?.is_active === true, now));
    const pool = currentRows.length > 0 ? currentRows : rows;
    const chosen = [...pool].sort((left, right) => {
      if (currentRows.length > 0) {
        const amount = (planById.get(right.plan_id)?.amount_cents ?? 0) - (planById.get(left.plan_id)?.amount_cents ?? 0);
        if (amount !== 0) {
          return amount;
        }
        const leftStart = left.current_period_start ? new Date(left.current_period_start).getTime() : 0;
        const rightStart = right.current_period_start ? new Date(right.current_period_start).getTime() : 0;
        return rightStart - leftStart;
      }
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    })[0];
    if (!chosen) {
      continue;
    }
    const profile = profileById.get(ownerId);
    const plan = planById.get(chosen.plan_id);
    accounts.push({
      id: chosen.id,
      accountSubscriptionId: chosen.id,
      status: chosen.status,
      current_period_end: chosen.current_period_end,
      created_at: chosen.created_at,
      updatedAt: new Date(chosen.updated_at).getTime(),
      ownerId,
      recordIds: rows.map((row) => row.id),
      account: {
        name: profile?.full_name?.trim() || profile?.email || ownerId,
        email: profile?.email ?? "",
        businessCount: namesByOwner.get(ownerId)?.length ?? 0,
      },
      plan: plan ? { name: plan.name, code: plan.code } : null,
      businessNames: namesByOwner.get(ownerId) ?? [],
      current: currentRows.some((row) => row.id === chosen.id),
    });
  }
  accounts.sort((left, right) => right.updatedAt - left.updatedAt);
  return accounts;
}

function accountSummary(accounts: AccountSubscription[]) {
  const now = Date.now();
  const soon = now + 30 * 24 * 60 * 60 * 1000;
  let active = 0;
  let expiring = 0;
  let expired = 0;
  for (const account of accounts) {
    if (account.current) {
      active += 1;
      if (account.current_period_end) {
        const end = new Date(account.current_period_end).getTime();
        if (Number.isFinite(end) && end > now && end <= soon) {
          expiring += 1;
        }
      }
    }
    const lapsed = account.status === "active" && account.current_period_end !== null && new Date(account.current_period_end).getTime() <= now;
    if (account.status === "expired" || lapsed) {
      expired += 1;
    }
  }
  return { total: accounts.length, active, expiring, expired };
}

export async function loadSubscriptions(input: { q?: string; status?: string; page?: string; size?: string }) {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true as const };
  }
  const term = adminSearch(input.q);
  const status = allowedFilter(input.status, subscriptionStatuses);
  const page = adminPage(input.page);
  const size = adminListSize(input.size);
  const range = pageRange(page, size);
  const accounts = await loadAccountSubscriptions(access);
  if (!accounts) {
    return { failed: true as const };
  }
  const needle = term.toLowerCase();
  const recordId = subscriptionUuid.test(term) ? term.toLowerCase() : "";
  const filtered = accounts.filter((account) => {
    if (status !== "all" && account.status !== status) {
      return false;
    }
    if (!needle) {
      return true;
    }
    if (recordId && (account.recordIds.some((id) => id.toLowerCase() === recordId) || account.ownerId.toLowerCase() === recordId)) {
      return true;
    }
    const haystack = [account.account.name, account.account.email, account.plan?.name ?? "", account.plan?.code ?? "", ...account.businessNames]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
  return {
    rows: filtered.slice(range.from, range.to + 1).map((account) => ({
      id: account.id,
      accountSubscriptionId: account.accountSubscriptionId,
      status: account.status,
      current_period_end: account.current_period_end,
      created_at: account.created_at,
      account: account.account,
      plan: account.plan,
    })),
    total: filtered.length,
    page,
    term,
    status,
    pageSize: size,
    summary: accountSummary(accounts),
  };
}

export async function loadPayments(input: { q?: string; status?: string; page?: string }) {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true as const };
  }
  const term = adminSearch(input.q);
  const status = allowedFilter(input.status, ["pending", "completed", "failed", "refunded", "canceled"]);
  const page = adminPage(input.page);
  const range = pageRange(page);
  let query = access.supabase
    .from("payments")
    .select("id, business_id, amount_cents, currency, status, provider_order_id, provider_capture_id, provider_refund_id, paid_at, created_at", { count: "exact" });
  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (term) {
    query = query.or(orIlike(["provider_order_id", "provider_capture_id", "provider_refund_id"], term));
  }
  const result = await query.order("created_at", { ascending: false }).range(range.from, range.to);
  if (result.error) {
    return { failed: true as const };
  }
  const businessIds = [...new Set(result.data.map((row) => row.business_id))];
  const businesses = businessIds.length === 0
    ? { data: [], error: null }
    : await access.supabase.from("businesses").select("id, name").in("id", businessIds);
  if (businesses.error) {
    return { failed: true as const };
  }
  const businessById = new Map((businesses.data ?? []).map((row) => [row.id, row.name]));
  return {
    rows: result.data.map((row) => ({ ...row, businessName: businessById.get(row.business_id) ?? "" })),
    total: result.count ?? 0,
    page,
    term,
    status,
    pageSize: adminPageSize,
  };
}

export async function loadEmailLogs(input: { q?: string; status?: string; page?: string }) {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true as const };
  }
  const term = adminSearch(input.q);
  const status = allowedFilter(input.status, ["queued", "sent", "failed"]);
  const page = adminPage(input.page);
  const range = pageRange(page);
  let query = access.supabase
    .from("email_logs")
    .select("id, to_email, template, status, provider_message_id, error_message, created_at", { count: "exact" });
  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (term) {
    query = query.ilike("to_email", ilikeContains(term));
  }
  const result = await query.order("created_at", { ascending: false }).range(range.from, range.to);
  if (result.error) {
    return { failed: true as const };
  }
  return { rows: result.data, total: result.count ?? 0, page, term, status, pageSize: adminPageSize };
}

export async function loadDomains(input: { q?: string; status?: string; page?: string }) {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true as const };
  }
  const term = adminSearch(input.q);
  const status = allowedFilter(input.status, ["pending", "verified", "active", "disabled"]);
  const page = adminPage(input.page);
  const range = pageRange(page);
  let query = access.supabase.from("custom_domains").select("id, business_id, hostname, status, created_at", { count: "exact" });
  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (term) {
    query = query.ilike("hostname", ilikeContains(term));
  }
  const result = await query.order("created_at", { ascending: false }).range(range.from, range.to);
  if (result.error) {
    return { failed: true as const };
  }
  const businessIds = [...new Set(result.data.map((row) => row.business_id))];
  const businesses = businessIds.length === 0
    ? { data: [], error: null }
    : await access.supabase.from("businesses").select("id, name").in("id", businessIds);
  if (businesses.error) {
    return { failed: true as const };
  }
  const businessById = new Map((businesses.data ?? []).map((row) => [row.id, row.name]));
  return {
    rows: result.data.map((row) => ({ ...row, businessName: businessById.get(row.business_id) ?? "" })),
    total: result.count ?? 0,
    page,
    term,
    status,
    pageSize: adminPageSize,
  };
}

