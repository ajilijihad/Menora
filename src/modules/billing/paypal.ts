import "server-only";

import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import {
  acceptCapture,
  approveLink,
  captureFacts,
  paypalAmountValue,
  paypalCertificateHost,
  paypalCheckoutAllowed,
  webhookCapture,
  webhookMayApply,
  webhookRefund,
  type PayPalOrder,
} from "@/lib/billing/paypal";
import { appOrigin } from "@/lib/menus/public-url";
import { refreshPublicMenu } from "@/lib/menus/refresh-public-menu";
import { notifyFailedPayment, notifyVerifiedPayment } from "@/modules/email/billing-mail";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { getPayPalConfig, type PayPalConfig } from "./index";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export class PayPalRequestError extends Error {
  constructor(readonly status: number, readonly issue: string) {
    super(issue);
  }
}

function adminClient(): AdminClient | null {
  try {
    return createAdminSupabaseClient();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return null;
    }
    throw error;
  }
}

async function refreshOwnerMenus(admin: AdminClient, businessId: string) {
  const business = await admin.from("businesses").select("owner_id, slug").eq("id", businessId).maybeSingle();
  if (!business.data) {
    return;
  }
  const owned = await admin.from("businesses").select("slug").eq("owner_id", business.data.owner_id);
  const slugs = new Set((owned.data ?? []).map((row) => row.slug));
  if (business.data.slug) {
    slugs.add(business.data.slug);
  }
  for (const slug of slugs) {
    refreshPublicMenu(slug);
  }
}

async function markCaptureFailed(admin: AdminClient, paymentId: string) {
  const failed = await admin
    .from("payments")
    .update({ status: "failed" })
    .eq("id", paymentId)
    .eq("status", "pending")
    .select("id");
  if (!failed.error && failed.data && failed.data.length > 0) {
    await notifyFailedPayment(paymentId);
  }
}

async function paypalToken(config: PayPalConfig): Promise<string> {
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(`${config.apiBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const body = (await response.json()) as { access_token?: string };
  if (!response.ok || !body.access_token) {
    throw new PayPalRequestError(response.status, "token_failed");
  }

  return body.access_token;
}

async function paypalJson<T>(
  config: PayPalConfig,
  path: string,
  init: { method: string; body?: unknown; requestId?: string },
): Promise<{ status: number; body: T }> {
  const token = await paypalToken(config);
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });
  if (init.requestId) {
    headers.set("PayPal-Request-Id", init.requestId);
  }
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: init.method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const body = (await response.json()) as T & { name?: string; details?: Array<{ issue?: string }> };
  if (!response.ok) {
    throw new PayPalRequestError(response.status, body.details?.[0]?.issue ?? body.name ?? "paypal_failed");
  }

  return { status: response.status, body };
}

export async function createPayPalOrder(input: {
  paymentId: string;
  amount: string;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string }> {
  const config = getPayPalConfig();
  const created = await paypalJson<PayPalOrder>(config, "/v2/checkout/orders", {
    method: "POST",
    requestId: input.paymentId,
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.paymentId,
          custom_id: input.paymentId,
          invoice_id: input.paymentId,
          description: input.description,
          amount: { currency_code: input.currency, value: input.amount },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
          },
        },
      },
    },
  });
  const approveUrl = approveLink(created.body);
  if (!created.body.id || !approveUrl) {
    throw new PayPalRequestError(502, "approve_link_missing");
  }

  return { id: created.body.id, approveUrl };
}

async function readCapturedOrder(config: PayPalConfig, orderId: string, paymentId: string): Promise<PayPalOrder> {
  try {
    const captured = await paypalJson<PayPalOrder>(config, `/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      requestId: `capture-${paymentId}`,
      body: {},
    });
    return captured.body;
  } catch (error) {
    if (error instanceof PayPalRequestError && error.issue === "ORDER_ALREADY_CAPTURED") {
      const existing = await paypalJson<PayPalOrder>(config, `/v2/checkout/orders/${orderId}`, { method: "GET" });
      return existing.body;
    }
    throw error;
  }
}

export async function captureOwnedPayment(input: {
  businessId: string;
  orderId: string;
}): Promise<"paid" | "failed" | "forbidden" | "unconfigured"> {
  const admin = adminClient();
  if (!admin) {
    return "unconfigured";
  }

  const payment = await admin
    .from("payments")
    .select("id, business_id, amount_cents, currency, status, provider_order_id, provider_capture_id")
    .eq("business_id", input.businessId)
    .eq("provider_order_id", input.orderId)
    .maybeSingle();
  if (payment.error || !payment.data) {
    return "forbidden";
  }

  if (payment.data.status === "completed") {
    return "paid";
  }
  if (payment.data.status !== "pending" || !payment.data.provider_order_id) {
    return "failed";
  }

  let order: PayPalOrder;
  try {
    order = await readCapturedOrder(getPayPalConfig(), payment.data.provider_order_id, payment.data.id);
  } catch {
    await markCaptureFailed(admin, payment.data.id);
    return "failed";
  }

  const facts = captureFacts(order, payment.data.provider_order_id);
  const accepted = facts !== null && acceptCapture(
    {
      paymentId: payment.data.id,
      orderId: payment.data.provider_order_id,
      amountCents: payment.data.amount_cents,
      currency: payment.data.currency,
    },
    facts,
  );
  if (!accepted || !facts) {
    await markCaptureFailed(admin, payment.data.id);
    return "failed";
  }

  const completed = await admin.rpc("complete_paypal_payment", {
    target_payment_id: payment.data.id,
    order_id: facts.orderId,
    capture_id: facts.captureId,
    captured_amount_cents: facts.minor,
    captured_currency: facts.currency,
  });
  if (completed.error || (completed.data !== "completed" && completed.data !== "already_completed")) {
    return "failed";
  }
  if (completed.data === "completed") {
    await notifyVerifiedPayment(payment.data.id);
  }

  await refreshOwnerMenus(admin, payment.data.business_id);
  return "paid";
}

export async function cancelOwnedPayment(input: { businessId: string; paymentId: string }): Promise<void> {
  const admin = adminClient();
  if (!admin) {
    return;
  }

  await admin
    .from("payments")
    .update({ status: "canceled" })
    .eq("id", input.paymentId)
    .eq("business_id", input.businessId)
    .eq("status", "pending");
}

export async function startPayPalCheckout(input: {
  businessId: string;
  planCode: string;
  locale: "en" | "ar";
}): Promise<{ approveUrl: string } | { error: "plan_invalid" | "unconfigured" | "live_not_released" | "checkout_failed" }> {
  let config: PayPalConfig;
  try {
    config = getPayPalConfig();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return { error: "unconfigured" };
    }
    throw error;
  }
  const gate = paypalCheckoutAllowed({
    environment: config.environment,
    nodeEnv: process.env.NODE_ENV ?? "development",
    livePayments: config.livePayments ? "true" : "false",
  });
  if (gate !== "allowed") {
    return { error: "live_not_released" };
  }

  let origin: string | null = null;
  try {
    origin = appOrigin(getPublicEnv().NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development");
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return { error: "unconfigured" };
    }
    throw error;
  }
  if (!origin) {
    return { error: "checkout_failed" };
  }

  const admin = adminClient();
  if (!admin) {
    return { error: "unconfigured" };
  }

  const plan = await admin
    .from("subscription_plans")
    .select("id, code, name, amount_cents, currency, is_active")
    .eq("code", input.planCode)
    .eq("is_active", true)
    .maybeSingle();
  const subscription = await admin
    .from("subscriptions")
    .select("id, status, created_at")
    .eq("business_id", input.businessId)
    .order("created_at", { ascending: false });
  const openSubscription = (subscription.data ?? []).find((row) =>
    row.status === "pending" || row.status === "active" || row.status === "past_due",
  ) ?? subscription.data?.[0];
  if (plan.error || subscription.error || !plan.data || !openSubscription || plan.data.amount_cents <= 0) {
    return { error: "plan_invalid" };
  }

  const amount = paypalAmountValue(plan.data.amount_cents, plan.data.currency);
  if (!amount) {
    return { error: "plan_invalid" };
  }

  await admin
    .from("payments")
    .update({ status: "canceled" })
    .eq("subscription_id", openSubscription.id)
    .eq("status", "pending");

  const paymentId = crypto.randomUUID();
  const inserted = await admin.from("payments").insert({
    id: paymentId,
    business_id: input.businessId,
    subscription_id: openSubscription.id,
    plan_id: plan.data.id,
    amount_cents: plan.data.amount_cents,
    currency: plan.data.currency,
    status: "pending",
    provider: "paypal",
  });
  if (inserted.error) {
    return { error: "checkout_failed" };
  }

  const returnUrl = `${origin}/${input.locale}/dashboard/businesses/${input.businessId}/billing/paypal/return`;
  const cancelUrl = `${origin}/${input.locale}/dashboard/businesses/${input.businessId}/billing/paypal/cancel?payment=${paymentId}`;
  try {
    const order = await createPayPalOrder({
      paymentId,
      amount,
      currency: plan.data.currency,
      description: `Menor ${plan.data.name} monthly plan`,
      returnUrl,
      cancelUrl,
    });
    const saved = await admin
      .from("payments")
      .update({ provider_order_id: order.id })
      .eq("id", paymentId)
      .eq("status", "pending");
    if (saved.error) {
      await markCaptureFailed(admin, paymentId);
      return { error: "checkout_failed" };
    }
    return { approveUrl: order.approveUrl };
  } catch {
    await markCaptureFailed(admin, paymentId);
    return { error: "checkout_failed" };
  }
}

export async function applyPayPalWebhook(input: {
  event: unknown;
  headers: {
    authAlgo: string | null;
    certUrl: string | null;
    transmissionId: string | null;
    transmissionSig: string | null;
    transmissionTime: string | null;
  };
}): Promise<"ignored" | "applied" | "unauthorized" | "unconfigured"> {
  const config = getPayPalConfig();
  if (!config.webhookId || !adminClient()) {
    return "unconfigured";
  }
  if (
    !input.headers.authAlgo
    || !input.headers.certUrl
    || !paypalCertificateHost(input.headers.certUrl)
    || !input.headers.transmissionId
    || !input.headers.transmissionSig
    || !input.headers.transmissionTime
  ) {
    return "unauthorized";
  }

  const verified = await paypalJson<{ verification_status?: string }>(config, "/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: {
      auth_algo: input.headers.authAlgo,
      cert_url: input.headers.certUrl,
      transmission_id: input.headers.transmissionId,
      transmission_sig: input.headers.transmissionSig,
      transmission_time: input.headers.transmissionTime,
      webhook_id: config.webhookId,
      webhook_event: input.event,
    },
  });
  if (!webhookMayApply(verified.body.verification_status)) {
    return "unauthorized";
  }

  const event = input.event as {
    id?: string;
    event_type?: string;
    resource?: Parameters<typeof webhookCapture>[0]["resource"] & Parameters<typeof webhookRefund>[0]["resource"];
  };
  const admin = adminClient();
  if (!admin || !event.id || !event.event_type) {
    return "unconfigured";
  }

  const refund = webhookRefund(event);
  if (refund) {
    const payment = await admin
      .from("payments")
      .select("id")
      .eq("provider_capture_id", refund.captureId)
      .maybeSingle();
    if (payment.data) {
      const recorded = await admin.rpc("refund_paypal_payment", {
        target_payment_id: payment.data.id,
        refund_id: refund.refundId,
      });
      if (recorded.error || (recorded.data !== "refunded" && recorded.data !== "already_refunded")) {
        throw recorded.error ?? new Error("refund reconciliation rejected");
      }
      await admin.rpc("record_paypal_event", {
        event_id: event.id,
        event_type: event.event_type,
        target_payment: payment.data.id,
      });
    }
    return "applied";
  }

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const facts = webhookCapture(event);
    if (!facts || !facts.customId) {
      return "ignored";
    }
    const payment = await admin
      .from("payments")
      .select("id, amount_cents, currency, provider_order_id, business_id")
      .eq("id", facts.customId)
      .maybeSingle();
    if (!payment.data || !payment.data.provider_order_id) {
      return "ignored";
    }
    if (!acceptCapture(
      {
        paymentId: payment.data.id,
        orderId: payment.data.provider_order_id,
        amountCents: payment.data.amount_cents,
        currency: payment.data.currency,
      },
      facts,
    )) {
      return "ignored";
    }
    const completed = await admin.rpc("complete_paypal_payment", {
      target_payment_id: payment.data.id,
      order_id: facts.orderId,
      capture_id: facts.captureId,
      captured_amount_cents: facts.minor,
      captured_currency: facts.currency,
    });
    if (completed.error || (completed.data !== "completed" && completed.data !== "already_completed")) {
      throw completed.error ?? new Error("payment completion rejected");
    }
    if (completed.data === "completed") {
      await notifyVerifiedPayment(payment.data.id);
    }
    await admin.rpc("record_paypal_event", {
      event_id: event.id,
      event_type: event.event_type,
      target_payment: payment.data.id,
    });
    await refreshOwnerMenus(admin, payment.data.business_id);
    return "applied";
  }

  return "ignored";
}

export async function refundCapturedPayment(paymentId: string): Promise<"refunded" | "failed" | "unconfigured"> {
  const admin = adminClient();
  if (!admin) {
    return "unconfigured";
  }

  const payment = await admin
    .from("payments")
    .select("id, provider_capture_id, amount_cents, currency, status")
    .eq("id", paymentId)
    .maybeSingle();
  if (payment.error || !payment.data?.provider_capture_id || payment.data.status !== "completed") {
    return "failed";
  }

  const amount = paypalAmountValue(payment.data.amount_cents, payment.data.currency);
  if (!amount) {
    return "failed";
  }

  try {
    const refunded = await paypalJson<{ id?: string; status?: string }>(
      getPayPalConfig(),
      `/v2/payments/captures/${payment.data.provider_capture_id}/refund`,
      {
        method: "POST",
        requestId: `refund-${payment.data.id}`,
        body: { amount: { currency_code: payment.data.currency, value: amount } },
      },
    );
    if (refunded.body.status !== "COMPLETED" || !refunded.body.id) {
      return "failed";
    }
    const recorded = await admin.rpc("refund_paypal_payment", {
      target_payment_id: payment.data.id,
      refund_id: refunded.body.id,
    });
    return recorded.data === "refunded" || recorded.data === "already_refunded" ? "refunded" : "failed";
  } catch {
    return "failed";
  }
}

