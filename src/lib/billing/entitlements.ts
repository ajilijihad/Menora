import { menuThemes, normalizeMenuTheme, type MenuTheme } from "@/lib/menus/appearance";

export const catalogPlanCodes = ["free", "starter", "pro"] as const;
export type CatalogPlanCode = (typeof catalogPlanCodes)[number];

export const subscriptionStatuses = ["pending", "active", "past_due", "canceled", "expired"] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export type PlanLimits = {
  code: string;
  name: string;
  description: string | null;
  amountCents: number;
  currency: string;
  isActive: boolean;
  maxBusinesses: number;
  maxProducts: number;
  maxThemes: number;
  analyticsRetentionDays: number;
  customDomains: boolean;
};

export type SubscriptionSnapshot = {
  status: SubscriptionStatus;
  planCode: string;
  amountCents: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  requestedPlanCode: string | null;
};

export type Entitlement = PlanLimits & {
  source: "subscription" | "free";
  effectiveStatus: SubscriptionStatus;
  paid: boolean;
};

const fallbackFree: PlanLimits = {
  code: "free",
  name: "Free",
  description: null,
  amountCents: 0,
  currency: "USD",
  isActive: true,
  maxBusinesses: 1,
  maxProducts: 25,
  maxThemes: 1,
  analyticsRetentionDays: 7,
  customDomains: false,
};

export function isSubscriptionCurrent(
  status: SubscriptionStatus,
  periodEnd: string | null,
  now: Date,
): boolean {
  if (status !== "active") {
    return false;
  }

  if (!periodEnd) {
    return true;
  }

  const end = new Date(periodEnd).getTime();
  return Number.isFinite(end) && end > now.getTime();
}

export function effectiveStatus(subscription: SubscriptionSnapshot, now: Date): SubscriptionStatus {
  if (
    subscription.status === "active"
    && subscription.currentPeriodEnd
    && !isSubscriptionCurrent(subscription.status, subscription.currentPeriodEnd, now)
  ) {
    return "expired";
  }

  return subscription.status;
}

export function resolveEntitlement(
  subscription: SubscriptionSnapshot | null,
  plans: PlanLimits[],
  now: Date,
): Entitlement {
  const free = plans.find((plan) => plan.code === "free" && plan.isActive) ?? fallbackFree;
  const current = subscription && isSubscriptionCurrent(subscription.status, subscription.currentPeriodEnd, now)
    ? plans.find((plan) => plan.code === subscription.planCode && plan.isActive) ?? null
    : null;
  const plan = current ?? free;
  const status = subscription ? effectiveStatus(subscription, now) : "active";

  return {
    ...plan,
    source: current ? "subscription" : "free",
    effectiveStatus: current ? status : subscription ? status : "active",
    paid: plan.amountCents > 0,
  };
}

export function themeAllowed(maxThemes: number, theme: string): theme is MenuTheme {
  const index = menuThemes.indexOf(theme as MenuTheme);
  return index >= 0 && index < maxThemes;
}

export function entitledTheme(maxThemes: number, stored: string | null | undefined): MenuTheme {
  const theme = normalizeMenuTheme(stored);
  if (theme && themeAllowed(maxThemes, theme)) {
    return theme;
  }

  return menuThemes[0];
}

export function withinLimit(used: number, max: number): boolean {
  return used < max;
}

export function analyticsVisibleFrom(retentionDays: number, now: Date): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

/**
 * A paid selection only records a request. Free can start immediately.
 * Callers must not copy a client-supplied status or expiration onto the row.
 */
export function planSelection(
  current: SubscriptionSnapshot,
  selected: PlanLimits,
): { kind: "free" } | { kind: "request" } | { kind: "unavailable" } {
  if (!selected.isActive) {
    return { kind: "unavailable" };
  }

  if (selected.amountCents === 0) {
    return { kind: "free" };
  }

  if (current.planCode === selected.code && isSubscriptionCurrent(current.status, current.currentPeriodEnd, new Date())) {
    return { kind: "unavailable" };
  }

  return { kind: "request" };
}

export function renewalPeriod(now: Date): { start: string; end: string } {
  const start = new Date(now);
  const end = new Date(now);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
