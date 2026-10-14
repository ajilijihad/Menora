import "server-only";

import {
  dailyCollections,
  dayList,
  netByCurrency,
  paymentTotals,
  planRevenue,
  resolveAdminWindow,
  type AdminPreset,
} from "@/lib/admin/overview";
import { inclusiveDays, periodChange, previousWindow } from "@/lib/analytics/present";
import { requirePlatformAdmin } from "@/modules/admin/guard";

export type MoneyTotal = { currency: string; amountCents: number };

export type AdminFinance = {
  preset: AdminPreset;
  from: string;
  to: string;
  span: number;
  collected: MoneyTotal[] | null;
  previousCollected: MoneyTotal[] | null;
  refunded: MoneyTotal[] | null;
  previousRefunded: MoneyTotal[] | null;
  net: MoneyTotal[] | null;
  collectedChange: number | null;
  refundedChange: number | null;
  netChange: number | null;
  failedChange: number | null;
  counts: { completed: number; failed: number; pending: number; refunded: number };
  plans: Array<{ planId: string | null; name: string; currency: string; amountCents: number; payments: number }> | null;
  days: string[];
  series: Array<{ currency: string; collected: number[]; refunded: number[] }> | null;
  rows: Array<{ day: string; currency: string; collectedCents: number; refundedCents: number }>;
};

type PaymentClient = Extract<Awaited<ReturnType<typeof requirePlatformAdmin>>, { ok: true }>["supabase"];

export async function loadAdminFinance(input: {
  range?: string;
  from?: string;
  to?: string;
  now: Date;
}): Promise<{ denied: true; status: 401 | 403 } | { failed: true } | AdminFinance> {
  const access = await requirePlatformAdmin();
  if (!access.ok) {
    return { denied: true, status: access.status };
  }

  const window = resolveAdminWindow(input, input.now);
  const previous = previousWindow(window.from, window.to);
  const previousStart = previous ? `${previous.from}T00:00:00.000Z` : window.start;
  const previousEnd = window.start;
  const { supabase } = access;

  const [collected, refunded, previousCollected, previousRefunded, failed, pending, previousFailed] = await Promise.all([
    loadCompleted(supabase, window.start, window.end),
    loadRefunded(supabase, window.start, window.end),
    loadCompleted(supabase, previousStart, previousEnd),
    loadRefunded(supabase, previousStart, previousEnd),
    exactCount(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", window.start).lt("created_at", window.end)),
    exactCount(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending").gte("created_at", window.start).lt("created_at", window.end)),
    exactCount(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", previousStart).lt("created_at", previousEnd)),
  ]);

  if (!collected || !refunded || !previousCollected || !previousRefunded || failed === null || pending === null || previousFailed === null) {
    return { failed: true };
  }

  const collectedTotals = collected.complete ? paymentTotals(collected.rows) : null;
  const refundedTotals = refunded.complete ? paymentTotals(refunded.rows) : null;
  const previousCollectedTotals = previousCollected.complete ? paymentTotals(previousCollected.rows) : null;
  const previousRefundedTotals = previousRefunded.complete ? paymentTotals(previousRefunded.rows) : null;
  const collectedMoney = collectedTotals?.reliable ? collectedTotals.totals : null;
  const refundedMoney = refundedTotals?.reliable ? refundedTotals.totals : null;
  const previousCollectedMoney = previousCollectedTotals?.reliable ? previousCollectedTotals.totals : null;
  const previousRefundedMoney = previousRefundedTotals?.reliable ? previousRefundedTotals.totals : null;
  const net = collectedMoney && refundedMoney ? netByCurrency(collectedMoney, refundedMoney) : null;
  const previousNet = previousCollectedMoney && previousRefundedMoney
    ? netByCurrency(previousCollectedMoney, previousRefundedMoney)
    : null;
  const days = dayList(window.from, window.to);
  const daily = collected.complete && refunded.complete ? dailyCollections(days, collected.rows, refunded.rows) : null;
  const plans = collected.complete && collectedTotals?.reliable ? await namedPlans(supabase, collected.rows) : null;

  return {
    preset: window.preset,
    from: window.from,
    to: window.to,
    span: inclusiveDays(window.from, window.to),
    collected: collectedMoney,
    previousCollected: previousCollectedMoney,
    refunded: refundedMoney,
    previousRefunded: previousRefundedMoney,
    net,
    collectedChange: sameCurrencyChange(collectedMoney, previousCollectedMoney),
    refundedChange: sameCurrencyChange(refundedMoney, previousRefundedMoney),
    netChange: sameCurrencyChange(net, previousNet),
    failedChange: periodChange(failed, previousFailed),
    counts: {
      completed: collected.count,
      failed,
      pending,
      refunded: refunded.count,
    },
    plans,
    days,
    series: daily?.series ?? null,
    rows: daily?.rows ?? [],
  };
}

function sameCurrencyChange(current: MoneyTotal[] | null, previous: MoneyTotal[] | null): number | null {
  if (!current || !previous || current.length !== 1 || previous.length !== 1 || current[0]?.currency !== previous[0]?.currency) {
    return null;
  }
  return periodChange(current[0].amountCents, previous[0].amountCents);
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

async function loadCompleted(supabase: PaymentClient, start: string, end: string) {
  const result = await supabase
    .from("payments")
    .select("amount_cents, currency, paid_at, plan_id", { count: "exact" })
    .eq("status", "completed")
    .not("paid_at", "is", null)
    .gte("paid_at", start)
    .lt("paid_at", end)
    .limit(1000);
  if (result.error || result.count === null) {
    return null;
  }
  const rows = result.data ?? [];
  return { count: result.count, complete: rows.length >= result.count, rows };
}

async function loadRefunded(supabase: PaymentClient, start: string, end: string) {
  const result = await supabase
    .from("payments")
    .select("amount_cents, currency, refunded_at", { count: "exact" })
    .eq("status", "refunded")
    .not("refunded_at", "is", null)
    .gte("refunded_at", start)
    .lt("refunded_at", end)
    .limit(1000);
  if (result.error || result.count === null) {
    return null;
  }
  const rows = result.data ?? [];
  return { count: result.count, complete: rows.length >= result.count, rows };
}

async function namedPlans(
  supabase: PaymentClient,
  rows: Array<{ plan_id: string | null; amount_cents: number; currency: string }>,
): Promise<AdminFinance["plans"]> {
  const grouped = planRevenue(rows);
  if (!grouped) {
    return null;
  }
  const ids = [...new Set(grouped.flatMap((row) => row.planId ? [row.planId] : []))];
  const plans = ids.length === 0
    ? { data: [], error: null }
    : await supabase.from("subscription_plans").select("id, name").in("id", ids);
  if (plans.error) {
    return null;
  }
  const names = new Map((plans.data ?? []).map((plan) => [plan.id, plan.name]));
  return grouped.map((row) => ({
    ...row,
    name: row.planId ? names.get(row.planId) ?? "" : "",
  }));
}
