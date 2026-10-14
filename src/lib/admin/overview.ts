import { inclusiveDays } from "@/lib/analytics/present";
import { currencyExponent, formatMinor, isCurrencyCode } from "@/lib/menus/money";

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const maxSpan = 366;

export type AdminPreset = 7 | 30 | 90 | "custom";

export type AdminActivity = {
  id: string;
  action: string;
  reason: string;
  createdAt: string;
  actor: string;
  self: boolean;
};

export type AdminOverview = {
  preset: AdminPreset;
  from: string;
  to: string;
  businesses: number;
  activeBusinesses: number;
  users: number;
  subscriptions: {
    active: number;
    pending: number;
    past_due: number;
    expired: number;
    canceled: number;
  };
  newBusinesses: number;
  previousNewBusinesses: number | null;
  newUsers: number;
  previousNewUsers: number | null;
  failedEmails: number;
  previousFailedEmails: number | null;
  failedEmailBacklog: number;
  pendingDomains: number;
  failedPayments: number;
  days: string[];
  businessSeries: number[] | null;
  userSeries: number[] | null;
  emailSeries: number[] | null;
  revenue: Array<{ currency: string; amountCents: number }> | null;
  previousRevenue: Array<{ currency: string; amountCents: number }> | null;
  revenueSeries: number[] | null;
  activity: AdminActivity[] | null;
};

export type AdminWindow = {
  preset: AdminPreset;
  from: string;
  to: string;
  start: string;
  end: string;
};

export function resolveAdminWindow(
  input: { range?: string; from?: string; to?: string },
  now: Date,
): AdminWindow {
  const today = utcDay(now);
  const preset = input.range === "7" || input.range === "30" || input.range === "90" ? Number(input.range) as 7 | 30 | 90 : null;
  if (preset) {
    return windowEnding(today, preset, preset);
  }

  if (isDay(input.from) && isDay(input.to) && input.from <= input.to && input.from <= today) {
    const endDay = input.to > today ? today : input.to;
    let startDay = input.from;
    if (inclusiveDays(startDay, endDay) > maxSpan) {
      startDay = shiftDay(endDay, -(maxSpan - 1));
    }
    if (startDay <= endDay) {
      return windowEnding(endDay, inclusiveDays(startDay, endDay), "custom", startDay);
    }
  }

  return windowEnding(today, 30, 30);
}

export function dayList(from: string, to: string): string[] {
  if (!isDay(from) || !isDay(to) || from > to) {
    return [];
  }

  const days: string[] = [];
  let cursor = from;
  while (cursor <= to && days.length <= maxSpan) {
    days.push(cursor);
    cursor = shiftDay(cursor, 1);
  }
  return days;
}

export function countsByDay(days: string[], stamps: string[]): number[] {
  const index = new Map(days.map((day, position) => [day, position]));
  const counts = days.map(() => 0);
  for (const stamp of stamps) {
    const slot = index.get(stamp.slice(0, 10));
    if (slot !== undefined) {
      counts[slot] += 1;
    }
  }
  return counts;
}

export function paymentTotals(
  rows: Array<{ amount_cents: number; currency: string }>,
): { totals: Array<{ currency: string; amountCents: number }>; reliable: boolean } {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!isCurrencyCode(row.currency) || !Number.isSafeInteger(row.amount_cents) || row.amount_cents < 0) {
      return { totals: [], reliable: false };
    }
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.amount_cents);
  }

  return {
    totals: [...totals.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, amountCents]) => ({ currency, amountCents })),
    reliable: true,
  };
}

export function paymentSeries(
  days: string[],
  rows: Array<{ amount_cents: number; currency: string; paid_at: string | null }>,
  currency: string,
): number[] | null {
  const totals = days.map(() => 0);
  const index = new Map(days.map((day, position) => [day, position]));
  for (const row of rows) {
    if (row.currency !== currency || !row.paid_at || !Number.isSafeInteger(row.amount_cents) || row.amount_cents < 0) {
      return null;
    }
    const slot = index.get(row.paid_at.slice(0, 10));
    if (slot === undefined) {
      return null;
    }
    totals[slot] += row.amount_cents;
  }
  return totals;
}

export function balancedShares(parts: number[]): number[] {
  const total = parts.reduce((sum, part) => sum + part, 0);
  if (total <= 0) {
    return parts.map(() => 0);
  }

  const raw = parts.map((part) => (part / total) * 100);
  const shares = raw.map((value) => Math.floor(value));
  let remainder = 100 - shares.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value), part: parts[index] ?? 0 }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);

  for (const entry of order) {
    if (remainder <= 0) {
      break;
    }
    if (entry.part > 0) {
      shares[entry.index] += 1;
      remainder -= 1;
    }
  }

  return shares;
}

export function formatAdminMoney(amountCents: number, currency: string, locale: string): string {
  const exponent = currencyExponent(currency);
  if (exponent === null || !Number.isSafeInteger(amountCents) || amountCents < 0) {
    return "";
  }

  const text = formatMinor(amountCents, exponent);
  const [wholeText = "0", fraction] = text.split(".");
  const grouped = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(wholeText));
  const amount = fraction === undefined ? grouped : `${grouped}.${localizeDigits(fraction, locale)}`;
  return `${amount} ${currency}`;
}

export function signedAdminMoney(amountCents: number, currency: string, locale: string): string {
  if (!Number.isSafeInteger(amountCents)) {
    return "";
  }
  if (amountCents < 0) {
    const text = formatAdminMoney(-amountCents, currency, locale);
    return text ? `−${text}` : "";
  }
  return formatAdminMoney(amountCents, currency, locale);
}

export function monthlyRecurring(
  rows: Array<{ amountCents: number; currency: string }>,
  complete: boolean,
): Array<{ currency: string; amountCents: number }> | null {
  if (!complete) {
    return null;
  }

  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!isCurrencyCode(row.currency) || !Number.isSafeInteger(row.amountCents) || row.amountCents < 0) {
      return null;
    }
    const next = (totals.get(row.currency) ?? 0) + row.amountCents;
    if (!Number.isSafeInteger(next)) {
      return null;
    }
    totals.set(row.currency, next);
  }

  return [...totals.entries()]
    .map(([currency, amountCents]) => ({ currency, amountCents }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export function netByCurrency(
  collected: Array<{ currency: string; amountCents: number }>,
  refunded: Array<{ currency: string; amountCents: number }>,
): Array<{ currency: string; amountCents: number }> {
  const totals = new Map<string, number>();
  for (const row of collected) {
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.amountCents);
  }
  for (const row of refunded) {
    totals.set(row.currency, (totals.get(row.currency) ?? 0) - row.amountCents);
  }
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amountCents]) => ({ currency, amountCents }));
}

export function planRevenue(
  rows: Array<{ plan_id: string | null; amount_cents: number; currency: string }>,
): Array<{ planId: string | null; currency: string; amountCents: number; payments: number }> | null {
  const grouped = new Map<string, { planId: string | null; currency: string; amountCents: number; payments: number }>();
  for (const row of rows) {
    if (!isCurrencyCode(row.currency) || !Number.isSafeInteger(row.amount_cents) || row.amount_cents < 0) {
      return null;
    }
    const key = `${row.plan_id ?? ""}:${row.currency}`;
    const current = grouped.get(key) ?? { planId: row.plan_id, currency: row.currency, amountCents: 0, payments: 0 };
    current.amountCents += row.amount_cents;
    current.payments += 1;
    grouped.set(key, current);
  }
  return [...grouped.values()].sort((left, right) => right.amountCents - left.amountCents || left.currency.localeCompare(right.currency));
}

export function dailyCollections(
  days: string[],
  collected: Array<{ amount_cents: number; currency: string; paid_at: string | null }>,
  refunded: Array<{ amount_cents: number; currency: string; refunded_at: string | null }>,
): {
  series: Array<{ currency: string; collected: number[]; refunded: number[] }>;
  rows: Array<{ day: string; currency: string; collectedCents: number; refundedCents: number }>;
} | null {
  const index = new Map(days.map((day, position) => [day, position]));
  const currencies = new Set<string>();
  const collectedByCurrency = new Map<string, number[]>();
  const refundedByCurrency = new Map<string, number[]>();

  if (!addMoney(collected, "paid_at", days, index, currencies, collectedByCurrency)) {
    return null;
  }
  if (!addMoney(refunded, "refunded_at", days, index, currencies, refundedByCurrency)) {
    return null;
  }

  const ordered = [...currencies].sort();
  const rows: Array<{ day: string; currency: string; collectedCents: number; refundedCents: number }> = [];
  const series = ordered.map((currency) => {
    const collectedAmounts = collectedByCurrency.get(currency) ?? days.map(() => 0);
    const refundedAmounts = refundedByCurrency.get(currency) ?? days.map(() => 0);
    days.forEach((day, position) => {
      const collectedCents = collectedAmounts[position] ?? 0;
      const refundedCents = refundedAmounts[position] ?? 0;
      if (collectedCents > 0 || refundedCents > 0) {
        rows.push({ day, currency, collectedCents, refundedCents });
      }
    });
    return { currency, collected: collectedAmounts, refunded: refundedAmounts };
  });

  return { series, rows };
}

function addMoney(
  rows: Array<{ amount_cents: number; currency: string; paid_at?: string | null; refunded_at?: string | null }>,
  field: "paid_at" | "refunded_at",
  days: string[],
  index: Map<string, number>,
  currencies: Set<string>,
  target: Map<string, number[]>,
): boolean {
  for (const row of rows) {
    const stamp = row[field];
    if (!isCurrencyCode(row.currency) || !Number.isSafeInteger(row.amount_cents) || row.amount_cents < 0 || !stamp) {
      return false;
    }
    const slot = index.get(stamp.slice(0, 10));
    if (slot === undefined) {
      return false;
    }
    currencies.add(row.currency);
    const amounts = target.get(row.currency) ?? days.map(() => 0);
    amounts[slot] = (amounts[slot] ?? 0) + row.amount_cents;
    target.set(row.currency, amounts);
  }
  return true;
}

export function fillCount(template: string, count: number, locale: string): string {
  return template.replaceAll("{count}", new Intl.NumberFormat(locale).format(count));
}

export function auditActionLabel<T extends Record<string, string>>(action: string, labels: T): string {
  return Object.prototype.hasOwnProperty.call(labels, action) ? labels[action] ?? action : action;
}

function localizeDigits(value: string, locale: string): string {
  return value.replace(/\d/g, (digit) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(digit)));
}

function windowEnding(endDay: string, span: number, preset: AdminPreset, startDay = shiftDay(endDay, -(span - 1))): AdminWindow {
  return {
    preset,
    from: startDay,
    to: endDay,
    start: `${startDay}T00:00:00.000Z`,
    end: `${shiftDay(endDay, 1)}T00:00:00.000Z`,
  };
}

function shiftDay(day: string, delta: number): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) + delta * 86400000).toISOString().slice(0, 10);
}

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isDay(value: string | undefined): value is string {
  if (!value || !dayPattern.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
