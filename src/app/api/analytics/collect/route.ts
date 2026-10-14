import { clientIpFromForwarded } from "@/lib/auth/ip";
import {
  allowCollect,
  deviceCategory,
  referrerSource,
  utcDay,
  visitorHash,
} from "@/lib/analytics/collect";
import { EnvConfigError } from "@/lib/env/error";
import { isPublicSlug } from "@/lib/businesses/slug";
import { requestHost } from "@/lib/domains/host";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 800) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const origin = request.headers.get("origin");
  if (origin && !sameOrigin(origin, request)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 800) {
      return Response.json({ ok: false }, { status: 400 });
    }
    body = JSON.parse(text);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const slug = typeof record.slug === "string" ? record.slug : "";
  const event = record.event === "product_view" ? "product_view" : record.event === "menu_view" ? "menu_view" : "";
  const productId = typeof record.productId === "string" ? record.productId : null;
  if (!isPublicSlug(slug) || !event || (productId !== null && !uuidPattern.test(productId))) {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (Object.keys(record).some((key) => key !== "slug" && key !== "event" && key !== "productId")) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const address = clientIpFromForwarded(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")).slice(0, 64);
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 300);
  const now = new Date();
  if (!allowCollect(`${address}|${slug}`, now.getTime())) {
    return Response.json({ ok: true }, { status: 202 });
  }

  const pageHost = requestHost(request.headers.get("host"));
  try {
    const supabase = createPublicSupabaseClient();
    await supabase.rpc("record_public_analytics", {
      target_slug: slug,
      target_event: event,
      target_product_id: event === "product_view" ? productId : null,
      target_device: deviceCategory(userAgent),
      target_referrer: referrerSource(request.headers.get("referer"), pageHost),
      target_visitor_hash: visitorHash(address, userAgent, utcDay(now)),
    });
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return Response.json({ ok: false }, { status: 503 });
    }
    return Response.json({ ok: true }, { status: 202 });
  }

  return Response.json({ ok: true }, { status: 202 });
}

function sameOrigin(origin: string, request: Request): boolean {
  try {
    const submitted = new URL(origin);
    const host = requestHost(request.headers.get("host"));
    return submitted.hostname.toLowerCase() === host && (submitted.protocol === "https:" || submitted.protocol === "http:");
  } catch {
    return false;
  }
}
