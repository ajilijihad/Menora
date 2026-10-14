import "server-only";

import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import {
  emailAmount,
  formatEmailWhen,
  paymentEmailKind,
  renderEmail,
  type EmailFacts,
  type EmailLocale,
} from "@/lib/email/messages";
import { appOrigin } from "@/lib/menus/public-url";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { deliverEmail } from "./deliver";

function localeOf(value: string | null | undefined): EmailLocale {
  return value === "ar" ? "ar" : "en";
}

async function paymentFacts(paymentId: string): Promise<{
  to: string;
  locale: EmailLocale;
  businessId: string;
  subscriptionId: string;
  completedCount: number;
  status: string;
  facts: EmailFacts;
} | null> {
  const admin = createAdminSupabaseClient();
  const payment = await admin
    .from("payments")
    .select("id, business_id, subscription_id, plan_id, amount_cents, currency, status, provider_capture_id, paid_at, granted_period_start, granted_period_end")
    .eq("id", paymentId)
    .maybeSingle();
  if (payment.error || !payment.data) {
    return null;
  }

  const [business, plan, completed] = await Promise.all([
    admin.from("businesses").select("id, name, owner_id, default_language, time_zone").eq("id", payment.data.business_id).maybeSingle(),
    payment.data.plan_id
      ? admin.from("subscription_plans").select("name").eq("id", payment.data.plan_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin.from("payments").select("id", { count: "exact", head: true }).eq("subscription_id", payment.data.subscription_id).eq("status", "completed"),
  ]);
  if (business.error || !business.data) {
    return null;
  }
  const profile = await admin.from("profiles").select("email, full_name").eq("id", business.data.owner_id).maybeSingle();
  if (profile.error || !profile.data?.email) {
    return null;
  }

  const locale = localeOf(business.data.default_language);
  const zone = business.data.time_zone;
  let receiptUrl = "";
  try {
    const origin = appOrigin(getPublicEnv().NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development");
    if (origin) {
      receiptUrl = `${origin}/${locale}/dashboard/businesses/${business.data.id}/billing/receipts/${payment.data.id}`;
    }
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      throw error;
    }
  }

  return {
    to: profile.data.email,
    locale,
    businessId: business.data.id,
    subscriptionId: payment.data.subscription_id,
    completedCount: completed.count ?? 0,
    status: payment.data.status,
    facts: {
      accountName: profile.data.full_name || profile.data.email,
      businessName: business.data.name,
      planName: plan.data?.name ?? "",
      amount: emailAmount(payment.data.amount_cents, payment.data.currency, locale),
      currency: payment.data.currency,
      paidAt: payment.data.paid_at ? formatEmailWhen(payment.data.paid_at, zone, locale) : "",
      periodStart: payment.data.granted_period_start ? formatEmailWhen(payment.data.granted_period_start, zone, locale) : "",
      periodEnd: payment.data.granted_period_end ? formatEmailWhen(payment.data.granted_period_end, zone, locale) : "",
      reference: payment.data.provider_capture_id ?? "",
      receiptUrl,
    },
  };
}

export async function notifyVerifiedPayment(paymentId: string): Promise<void> {
  try {
    const loaded = await paymentFacts(paymentId);
    if (!loaded || loaded.status !== "completed" || !loaded.facts.reference) {
      return;
    }
    const template = paymentEmailKind(loaded.completedCount);
    await deliverEmail({
      idempotencyKey: `${template}:${paymentId}`,
      to: loaded.to,
      template: renderEmail(template, loaded.locale, loaded.facts),
      businessId: loaded.businessId,
      subscriptionId: loaded.subscriptionId,
      paymentId,
    });
  } catch (error) {
    console.error("Payment email was not sent.", error);
  }
}

export async function notifyFailedPayment(paymentId: string): Promise<void> {
  try {
    const loaded = await paymentFacts(paymentId);
    if (!loaded || loaded.status !== "failed") {
      return;
    }
    await deliverEmail({
      idempotencyKey: `payment_failed:${paymentId}`,
      to: loaded.to,
      template: renderEmail("payment_failed", loaded.locale, loaded.facts),
      businessId: loaded.businessId,
      subscriptionId: loaded.subscriptionId,
      paymentId,
    });
  } catch (error) {
    console.error("Payment failure email was not sent.", error);
  }
}
