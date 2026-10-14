import { createHash } from "node:crypto";

export const deviceCategories = ["mobile", "tablet", "desktop", "unknown"] as const;
export type DeviceCategory = (typeof deviceCategories)[number];

export const referrerSources = ["direct", "search", "social", "other"] as const;
export type ReferrerSource = (typeof referrerSources)[number];

export const analyticsEvents = ["menu_view", "product_view"] as const;
export type AnalyticsEventName = (typeof analyticsEvents)[number];

const searchHosts = ["google.", "bing.com", "duckduckgo.com", "yahoo.", "baidu.com", "yandex."];
const socialHosts = [
  "facebook.com",
  "instagram.com",
  "fb.com",
  "t.co",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linkedin.com",
  "whatsapp.com",
  "telegram.",
  "snapchat.com",
  "pinterest.",
];

export function deviceCategory(userAgent: string): DeviceCategory {
  const value = userAgent.slice(0, 300);
  if (!value.trim()) {
    return "unknown";
  }

  if (/ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(value)) {
    return "tablet";
  }

  if (/mobile|iphone|ipod|android|iemobile|blackberry|opera mini/i.test(value)) {
    return "mobile";
  }

  if (/windows|macintosh|linux|cros|x11/i.test(value)) {
    return "desktop";
  }

  return "unknown";
}

export function referrerSource(referrer: string | null | undefined, pageHost: string): ReferrerSource {
  if (!referrer) {
    return "direct";
  }

  let host = "";
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "direct";
    }
    host = url.hostname.toLowerCase();
  } catch {
    return "direct";
  }

  if (!host || host === pageHost.toLowerCase()) {
    return "direct";
  }

  if (matchesHost(host, searchHosts)) {
    return "search";
  }

  if (matchesHost(host, socialHosts)) {
    return "social";
  }

  return "other";
}

function matchesHost(host: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith(".")) {
      return host.includes(pattern) || host.endsWith(`.${pattern.slice(0, -1)}`);
    }

    return host === pattern || host.endsWith(`.${pattern}`);
  });
}

/**
 * A daily hash used only to collapse repeated views.
 * The address and user agent are not stored.
 */
export function visitorHash(address: string, userAgent: string, utcDay: string): string {
  const material = `${utcDay}|${address.slice(0, 64)}|${userAgent.slice(0, 160)}`;
  return createHash("sha256").update(material).digest("hex");
}

export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

const hits = new Map<string, { count: number; reset: number }>();
const maxKeys = 2000;

export function allowCollect(key: string, nowMs: number, limit = 20, windowMs = 60_000): boolean {
  if (hits.size >= maxKeys) {
    const oldest = hits.keys().next().value;
    if (oldest) {
      hits.delete(oldest);
    }
  }

  const current = hits.get(key);
  if (!current || current.reset <= nowMs) {
    hits.set(key, { count: 1, reset: nowMs + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}

export function resetCollectLimiter(): void {
  hits.clear();
}

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

export function analyticsWindow(
  from: string | undefined,
  to: string | undefined,
  retentionDays: number,
  now: Date,
): { from: string; to: string; start: string; end: string } | null {
  const retention = Math.min(Math.max(Math.trunc(retentionDays), 1), 3660);
  const today = utcDay(now);
  const earliest = utcDay(new Date(now.getTime() - retention * 24 * 60 * 60 * 1000));
  const requestedFrom = from && dayPattern.test(from) ? from : earliest;
  const requestedTo = to && dayPattern.test(to) ? to : today;
  if (requestedFrom > requestedTo) {
    return null;
  }

  let start = requestedFrom < earliest ? earliest : requestedFrom;
  const endDay = requestedTo > today ? today : requestedTo;
  if (start > endDay) {
    return null;
  }

  const span = Math.round((Date.parse(`${endDay}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`)) / 86400000);
  if (span > 366) {
    start = utcDay(new Date(Date.parse(`${endDay}T00:00:00.000Z`) - 366 * 86400000));
  }

  return {
    from: start,
    to: endDay,
    start: `${start}T00:00:00.000Z`,
    end: `${utcDay(new Date(Date.parse(`${endDay}T00:00:00.000Z`) + 86400000))}T00:00:00.000Z`,
  };
}
