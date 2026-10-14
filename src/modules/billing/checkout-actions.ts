"use server";

import { redirect } from "next/navigation";

import { parseLocale } from "@/lib/auth/schemas";
import { requirePlatformAdmin } from "@/modules/admin/guard";
import { getMyBusiness } from "@/modules/businesses/queries";

import { cancelPaidPlanAction, requestPlanAction, type BillingActionState } from "./actions";
import { refundCapturedPayment, startPayPalCheckout } from "./paypal";

const idle: BillingActionState = { status: "idle", message: "requested" };

function billingPath(locale: string, notice: string): string {
  return `/${locale}/dashboard/billing?notice=${notice}`;
}

export async function startCheckoutAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  const businessId = String(formData.get("businessId") ?? "");
  const planCode = String(formData.get("planCode") ?? "");
  if (!locale || !businessId || !planCode) {
    return;
  }

  const business = await getMyBusiness(businessId);
  if (!business || business.role !== "owner") {
    redirect(`/${locale}/dashboard`);
  }

  const result = await startPayPalCheckout({
    businessId: business.id,
    planCode,
    locale,
  });
  if ("approveUrl" in result) {
    redirect(result.approveUrl);
  }

  redirect(billingPath(locale, result.error));
}

export async function requestPlanFormAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  const businessId = String(formData.get("businessId") ?? "");
  const result = await requestPlanAction(idle, formData);
  if (!locale || !businessId) {
    return;
  }

  redirect(billingPath(locale, result.message));
}

export async function cancelPlanFormAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  const businessId = String(formData.get("businessId") ?? "");
  const result = await cancelPaidPlanAction(idle, formData);
  if (!locale || !businessId) {
    return;
  }

  redirect(billingPath(locale, result.message));
}

const paymentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function refundPaymentAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  if (!locale) {
    return;
  }

  const access = await requirePlatformAdmin();
  if (!access.ok || formData.get("confirm") !== "yes") {
    redirect(`/${locale}/admin/payments?notice=${access.ok ? "invalid" : "forbidden"}`);
  }

  const paymentId = String(formData.get("paymentId") ?? "");
  if (!paymentIdPattern.test(paymentId)) {
    redirect(`/${locale}/admin/payments?notice=not_found`);
  }

  const result = await refundCapturedPayment(paymentId);
  if (result !== "refunded") {
    redirect(`/${locale}/admin/payments?notice=${result === "unconfigured" ? "unconfigured" : "failed"}`);
  }
  const noted = await access.supabase.rpc("admin_note_refund", {
    target_payment: paymentId,
    target_reason: String(formData.get("reason") ?? ""),
  });
  redirect(`/${locale}/admin/payments?notice=${noted.error ? "audit_failed" : "refunded"}`);
}
