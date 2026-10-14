import { currencyExponent, formatMinor, minorUnits } from "@/lib/menus/money";

export type PayPalEnvironment = "sandbox" | "live";

export type CaptureFacts = {
  orderId: string;
  captureId: string;
  status: string;
  currency: string;
  minor: number;
  customId: string | null;
};

export type ExpectedPayment = {
  paymentId: string;
  orderId: string;
  amountCents: number;
  currency: string;
};

export type PaidPeriod = {
  start: string;
  end: string;
};

const paypalHosts = new Set([
  "api-m.paypal.com",
  "api-m.sandbox.paypal.com",
  "api.paypal.com",
  "api.sandbox.paypal.com",
]);

export function paypalApiBase(environment: PayPalEnvironment): string {
  return environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function paypalCheckoutAllowed(input: {
  environment: PayPalEnvironment;
  nodeEnv: string;
  livePayments: string | undefined;
}): "allowed" | "live_in_development" | "live_not_released" {
  if (input.environment !== "live") {
    return "allowed";
  }

  if (input.nodeEnv !== "production") {
    return "live_in_development";
  }

  return input.livePayments === "true" ? "allowed" : "live_not_released";
}

export function paypalAmountValue(amountCents: number, currency: string): string | null {
  const exponent = currencyExponent(currency);
  if (exponent === null) {
    return null;
  }

  const value = formatMinor(amountCents, exponent);
  return value.length > 0 ? value : null;
}

export function paypalMinorUnits(value: string, currency: string): number | null {
  const exponent = currencyExponent(currency);
  if (exponent === null) {
    return null;
  }

  return minorUnits(value, exponent);
}

export function acceptCapture(expected: ExpectedPayment, actual: CaptureFacts): boolean {
  return actual.status === "COMPLETED"
    && actual.orderId === expected.orderId
    && actual.captureId.length > 0
    && actual.customId === expected.paymentId
    && actual.currency === expected.currency
    && actual.minor === expected.amountCents;
}

export function nextPaidPeriod(input: {
  status: string;
  periodEnd: string | null;
  now: Date;
}): PaidPeriod {
  const existingEnd = input.periodEnd ? new Date(input.periodEnd) : null;
  const extend = input.status === "active"
    && existingEnd !== null
    && Number.isFinite(existingEnd.getTime())
    && existingEnd.getTime() > input.now.getTime();
  const start = extend && existingEnd ? existingEnd : input.now;
  const end = new Date(start.getTime());
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export type RenewalState = {
  status: string;
  periodEnd: string | null;
  captureIds: string[];
};

export function applyRenewal(
  state: RenewalState,
  captureId: string,
  now: Date,
): { state: RenewalState; result: "completed" | "already_completed" } {
  if (state.captureIds.includes(captureId)) {
    return { state, result: "already_completed" };
  }

  const period = nextPaidPeriod({ status: state.status, periodEnd: state.periodEnd, now });
  return {
    state: {
      status: "active",
      periodEnd: period.end,
      captureIds: [...state.captureIds, captureId],
    },
    result: "completed",
  };
}

export function webhookMayApply(verificationStatus: string | null | undefined): boolean {
  return verificationStatus === "SUCCESS";
}

export function paypalCertificateHost(certUrl: string): boolean {
  try {
    const url = new URL(certUrl);
    return url.protocol === "https:" && paypalHosts.has(url.hostname);
  } catch {
    return false;
  }
}

type PayPalLink = { href?: string; rel?: string };
type PayPalAmount = { currency_code?: string; value?: string };
type PayPalCapture = {
  id?: string;
  status?: string;
  amount?: PayPalAmount;
  custom_id?: string;
  invoice_id?: string;
};

export type PayPalOrder = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    custom_id?: string;
    invoice_id?: string;
    reference_id?: string;
    payments?: { captures?: PayPalCapture[] };
  }>;
};

export function approveLink(order: PayPalOrder): string | null {
  const link = order.links?.find((item) => item.rel === "payer-action" || item.rel === "approve");
  if (!link?.href) {
    return null;
  }

  try {
    const url = new URL(link.href);
    const host = url.hostname;
    const paypal = host === "www.paypal.com" || host === "www.sandbox.paypal.com";
    return url.protocol === "https:" && paypal ? link.href : null;
  } catch {
    return null;
  }
}

export function webhookCapture(event: {
  resource?: {
    id?: string;
    status?: string;
    custom_id?: string;
    invoice_id?: string;
    amount?: { currency_code?: string; value?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}): CaptureFacts | null {
  const resource = event.resource;
  const orderId = resource?.supplementary_data?.related_ids?.order_id;
  const currency = resource?.amount?.currency_code;
  const value = resource?.amount?.value;
  if (!resource?.id || !resource.status || !orderId || !currency || !value) {
    return null;
  }

  const minor = paypalMinorUnits(value, currency);
  if (minor === null) {
    return null;
  }

  return {
    orderId,
    captureId: resource.id,
    status: resource.status,
    currency,
    minor,
    customId: resource.custom_id ?? resource.invoice_id ?? null,
  };
}

export function webhookRefund(event: {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    links?: Array<{ href?: string; rel?: string }>;
  };
}): { captureId: string; refundId: string } | null {
  const type = event.event_type ?? "";
  const refundEvent = type === "PAYMENT.CAPTURE.REFUNDED"
    || type === "PAYMENT.CAPTURE.REVERSED"
    || type === "PAYMENT.REFUND.COMPLETED";
  if (!refundEvent || !event.resource?.id) {
    return null;
  }

  if (event.resource.status !== "COMPLETED" && event.resource.status !== "REFUNDED") {
    return null;
  }

  const captureHref = event.resource.links?.find((link) => link.href?.includes("/captures/"))?.href;
  const linkedCapture = captureHref?.split("/captures/")[1]?.split(/[/?#]/)[0];
  if (linkedCapture) {
    return { captureId: linkedCapture, refundId: event.resource.id };
  }

  if (!event.id) {
    return null;
  }

  return { captureId: event.resource.id, refundId: event.id };
}

export function captureFacts(order: PayPalOrder, expectedOrderId: string): CaptureFacts | null {
  const unit = order.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (!order.id || !capture?.id || !capture.status || !capture.amount?.currency_code || !capture.amount.value) {
    return null;
  }

  const minor = paypalMinorUnits(capture.amount.value, capture.amount.currency_code);
  if (minor === null || order.id !== expectedOrderId) {
    return null;
  }

  return {
    orderId: order.id,
    captureId: capture.id,
    status: capture.status,
    currency: capture.amount.currency_code,
    minor,
    customId: capture.custom_id ?? unit?.custom_id ?? unit?.invoice_id ?? null,
  };
}
