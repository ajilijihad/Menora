import "server-only";

import {
  dueReminder,
  emailAmount,
  formatEmailWhen,
  renderEmail,
  type EmailLocale,
  type ReminderType,
} from "@/lib/email/messages";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { deliverEmail } from "./deliver";

type DueSubscription = {
  id: string;
  business_id: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
};

export type ReminderRun = {
  expired: number;
  sent: number;
  failed: number;
  skipped: number;
};

function localeOf(value: string | null | undefined): EmailLocale {
  return value === "ar" ? "ar" : "en";
}

function templateFor(type: ReminderType): "reminder_7" | "reminder_3" | "reminder_1" | "subscription_expired" {
  return type === "expired" ? "subscription_expired" : type;
}

export async function runReminderJob(now = new Date()): Promise<ReminderRun> {
  const admin = createAdminSupabaseClient();
  const expired = await admin.rpc("expire_due_subscriptions");
  if (expired.error) {
    throw expired.error;
  }

  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const recent = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const [active, ended] = await Promise.all([
    admin
      .from("subscriptions")
      .select("id, business_id, plan_id, status, current_period_end")
      .eq("status", "active")
      .not("current_period_end", "is", null)
      .lte("current_period_end", horizon),
    admin
      .from("subscriptions")
      .select("id, business_id, plan_id, status, current_period_end")
      .eq("status", "expired")
      .not("current_period_end", "is", null)
      .gte("current_period_end", recent)
      .lte("current_period_end", now.toISOString()),
  ]);
  if (active.error || ended.error) {
    throw active.error ?? ended.error;
  }

  const subscriptions = [...(active.data ?? []), ...(ended.data ?? [])] as DueSubscription[];
  const businessIds = [...new Set(subscriptions.map((row) => row.business_id))];
  const planIds = [...new Set(subscriptions.map((row) => row.plan_id))];
  const [businesses, plans] = await Promise.all([
    businessIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : admin.from("businesses").select("id, name, owner_id, default_language, time_zone").in("id", businessIds),
    planIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : admin.from("subscription_plans").select("id, name, amount_cents, currency").in("id", planIds),
  ]);
  if (businesses.error || plans.error) {
    throw businesses.error ?? plans.error;
  }

  const ownerIds = [...new Set((businesses.data ?? []).map((row) => row.owner_id))];
  const profiles = ownerIds.length === 0
    ? { data: [], error: null }
    : await admin.from("profiles").select("id, email, full_name").in("id", ownerIds);
  if (profiles.error) {
    throw profiles.error;
  }

  const businessById = new Map((businesses.data ?? []).map((row) => [row.id, row]));
  const planById = new Map((plans.data ?? []).map((row) => [row.id, row]));
  const profileById = new Map((profiles.data ?? []).map((row) => [row.id, row]));
  const result: ReminderRun = {
    expired: expired.data ?? 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const subscription of subscriptions) {
    if (!subscription.current_period_end) {
      result.skipped += 1;
      continue;
    }
    const reminder = dueReminder(new Date(subscription.current_period_end), now);
    if (!reminder) {
      result.skipped += 1;
      continue;
    }
    const business = businessById.get(subscription.business_id);
    const plan = planById.get(subscription.plan_id);
    const profile = business ? profileById.get(business.owner_id) : undefined;
    if (!business || !plan || !profile?.email) {
      result.failed += 1;
      continue;
    }

    const claimed = await admin.rpc("claim_subscription_reminder", {
      target_subscription: subscription.id,
      target_period_end: subscription.current_period_end,
      target_type: reminder,
    });
    if (claimed.error || !claimed.data) {
      result.skipped += 1;
      continue;
    }

    const locale = localeOf(business.default_language);
    const periodEnd = formatEmailWhen(subscription.current_period_end, business.time_zone, locale);
    const delivery = await deliverEmail({
      idempotencyKey: `reminder:${subscription.id}:${subscription.current_period_end}:${reminder}`,
      to: profile.email,
      template: renderEmail(templateFor(reminder), locale, {
        accountName: profile.full_name || profile.email,
        businessName: business.name,
        planName: plan.name,
        amount: emailAmount(plan.amount_cents, plan.currency, locale),
        currency: plan.currency,
        paidAt: "",
        periodStart: "",
        periodEnd,
        reference: "",
        receiptUrl: "",
      }),
      businessId: business.id,
      subscriptionId: subscription.id,
      paymentId: null,
    });
    await admin.rpc("finish_subscription_reminder", {
      target_id: claimed.data,
      target_status: delivery === "failed" ? "failed" : "sent",
      target_log: null,
    });
    if (delivery === "sent") {
      result.sent += 1;
    } else if (delivery === "duplicate") {
      result.skipped += 1;
    } else {
      result.failed += 1;
    }
  }

  return result;
}
