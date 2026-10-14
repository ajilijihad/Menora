import "server-only";

import { connection } from "next/server";

import { analyticsWindow, utcDay } from "@/lib/analytics/collect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AnalyticsDay = { day: string; menu: number; product: number };
export type AnalyticsSlice = { key: string; views: number };
export type AnalyticsRank = { id: string; name: string; views: number };

export type AnalyticsSummary = {
  from: string;
  to: string;
  menuViews: number;
  productViews: number;
  days: AnalyticsDay[];
  devices: AnalyticsSlice[];
  referrers: AnalyticsSlice[];
  products: AnalyticsRank[];
  categories: AnalyticsRank[];
};

export async function loadAnalyticsSummary(
  businessId: string,
  from: string | undefined,
  to: string | undefined,
): Promise<
  | { ok: true; summary: AnalyticsSummary; pageFrom: string; pageTo: string; visibleFrom: string; today: string; retentionDays: number }
  | { ok: false; reason: "denied" | "failed" }
  | { ok: false; reason: "invalid"; visibleFrom: string; today: string }
> {
  const supabase = await createServerSupabaseClient();
  const retention = await supabase.rpc("analytics_visible_from", { target_business_id: businessId });
  if (retention.error) {
    return { ok: false, reason: "failed" };
  }
  if (!retention.data) {
    return { ok: false, reason: "denied" };
  }

  await connection();
  const now = new Date();
  const today = utcDay(now);
  const visibleStamp = Date.parse(retention.data);
  const visibleFrom = Number.isNaN(visibleStamp) ? today : utcDay(new Date(visibleStamp));
  const retentionDays = Math.max(1, Math.round((Date.now() - Date.parse(retention.data)) / 86400000));
  const window = analyticsWindow(from, to, retentionDays, now);
  if (!window) {
    return { ok: false, reason: "invalid", visibleFrom, today };
  }

  const result = await supabase.rpc("business_analytics_summary", {
    target_business_id: businessId,
    range_start: window.start,
    range_end: window.end,
  });
  if (result.error) {
    return { ok: false, reason: "failed" };
  }
  if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) {
    return { ok: false, reason: "denied" };
  }

  return {
    ok: true,
    summary: parseSummary(result.data),
    pageFrom: window.from,
    pageTo: window.to,
    visibleFrom,
    today,
    retentionDays,
  };
}

function parseSummary(value: object): AnalyticsSummary {
  const record = value as Record<string, unknown>;
  return {
    from: typeof record.from === "string" ? record.from : "",
    to: typeof record.to === "string" ? record.to : "",
    menuViews: numberValue(record.menuViews),
    productViews: numberValue(record.productViews),
    days: arrayOf(record.days).map((item) => ({
      day: text(item.day),
      menu: numberValue(item.menu),
      product: numberValue(item.product),
    })),
    devices: arrayOf(record.devices).map((item) => ({ key: text(item.device), views: numberValue(item.views) })),
    referrers: arrayOf(record.referrers).map((item) => ({ key: text(item.source), views: numberValue(item.views) })),
    products: arrayOf(record.products).map(rank),
    categories: arrayOf(record.categories).map(rank),
  };
}

function rank(item: Record<string, unknown>): AnalyticsRank {
  return { id: text(item.id), name: text(item.name), views: numberValue(item.views) };
}

function arrayOf(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
