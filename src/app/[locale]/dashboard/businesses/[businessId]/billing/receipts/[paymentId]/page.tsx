import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PrintButton } from "@/components/billing/print-button";
import { LoadingState } from "@/components/states/loading-state";
import { canEditBusiness } from "@/lib/businesses/access";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/i18n/format";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getMyBusiness } from "@/modules/businesses/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ReceiptPageProps = {
  params: Promise<{ locale: string; businessId: string; paymentId: string }>;
};

export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).billing.receipt, robots: { index: false, follow: false } };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { locale, businessId, paymentId } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <ReceiptContent locale={locale} businessId={businessId} paymentId={paymentId} />
    </Suspense>
  );
}

function formatWhen(value: string | null, locale: Locale, empty: string): string {
  if (!value) {
    return empty;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return empty;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
}

async function ReceiptContent({
  locale,
  businessId,
  paymentId,
}: {
  locale: Locale;
  businessId: string;
  paymentId: string;
}) {
  const business = await getMyBusiness(businessId);
  if (!business || !canEditBusiness(business.role)) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const payment = await supabase
    .from("payments")
    .select("id, business_id, plan_id, amount_cents, currency, status, provider_capture_id, paid_at, granted_period_start, granted_period_end")
    .eq("id", paymentId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (payment.error || !payment.data || (payment.data.status !== "completed" && payment.data.status !== "refunded")) {
    notFound();
  }

  const plan = payment.data.plan_id
    ? await supabase.from("subscription_plans").select("name").eq("id", payment.data.plan_id).maybeSingle()
    : { data: null };
  const copy = getDictionary(locale).billing;
  const amount = `${formatMoney(payment.data.amount_cents, payment.data.currency, locale)} ${payment.data.currency}`;
  const period = `${formatWhen(payment.data.granted_period_start, locale, copy.openEnded)} – ${formatWhen(payment.data.granted_period_end, locale, copy.openEnded)}`;

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Menor</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{copy.receipt}</h1>
          <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">{copy.receiptNotice}</p>
        </div>
        <PrintButton label={copy.printReceipt} />
      </div>
      <dl className="grid gap-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 sm:grid-cols-2">
        <Item label={copy.businessName} value={business.name} />
        <Item label={copy.current} value={plan.data?.name ?? copy.openEnded} />
        <Item label={copy.amountLabel} value={amount} />
        <Item label={copy.status} value={copy.paymentStatuses[payment.data.status]} />
        <Item label={copy.period} value={period} />
        <Item label={copy.expiration} value={formatWhen(payment.data.granted_period_end, locale, copy.openEnded)} />
        <Item label={copy.transactionReference} value={payment.data.provider_capture_id ?? copy.openEnded} />
        <Item label={copy.paidAt} value={formatWhen(payment.data.paid_at, locale, copy.openEnded)} />
      </dl>
      <Link href={`/${locale}/dashboard/billing`} className="text-sm font-medium underline-offset-4 hover:underline print:hidden">
        {copy.title}
      </Link>
    </main>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
