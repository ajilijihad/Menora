import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminFilters, AdminNotice, AdminPager, AdminSection, adminFieldClassName, adminWhen } from "@/components/admin/frame";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel, statusActionClassName } from "@/components/states/status-panel";
import { formatMoney } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { refundPaymentFormAction } from "@/modules/admin/actions";
import { loadPayments } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).admin.navPayments, robots: { index: false, follow: false } };
}

export default async function PaymentsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <Payments locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Payments({ locale, searchParams }: { locale: Locale; searchParams: PageProps["searchParams"] }) {
  const dict = getDictionary(locale);
  const query = await searchParams;
  const list = await loadPayments({ q: first(query.q), status: first(query.status), page: first(query.page) });
  if ("denied" in list) {
    return <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription} />;
  }
  if ("failed" in list) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }
  const copy = dict.admin;
  const statuses = (["pending", "completed", "failed", "refunded", "canceled"] as const).map((value) => ({
    value,
    label: dict.billing.paymentStatuses[value],
  }));

  return (
    <AdminSection title={copy.navPayments} description={copy.paymentNote}>
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <AdminFilters locale={locale} path="payments" copy={copy} q={list.term} status={list.status} statuses={statuses} />
      {list.rows.length === 0 ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.empty}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-start dark:border-zinc-800">
                <th className="px-2 py-2 font-medium">{copy.columns.business}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.amount}</th>
                <th className="px-2 py-2 font-medium">{copy.status}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.reference}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.order}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.when}</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="px-2 py-3">{row.businessName || copy.empty}</td>
                  <td className="px-2 py-3">{formatMoney(row.amount_cents, row.currency, locale)} {row.currency}</td>
                  <td className="px-2 py-3">{dict.billing.paymentStatuses[row.status]}</td>
                  <td className="px-2 py-3 font-mono text-xs">{row.provider_capture_id || copy.empty}</td>
                  <td className="px-2 py-3 font-mono text-xs">{row.provider_order_id || copy.empty}</td>
                  <td className="px-2 py-3">{adminWhen(row.paid_at ?? row.created_at, locale, dict.billing.openEnded)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPager locale={locale} path="payments" copy={copy} page={list.page} total={list.total} pageSize={list.pageSize} q={list.term} status={list.status} />
      <form action={refundPaymentFormAction} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.billing.refundDescription}</p>
        <label className="flex flex-col gap-2 text-sm font-medium">
          {dict.billing.paymentId}
          <input name="paymentId" required className={adminFieldClassName} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          {copy.reason}
          <input name="reason" required minLength={8} maxLength={500} className={adminFieldClassName} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="confirm" value="yes" required />
          {copy.confirm}
        </label>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className={statusActionClassName}>{copy.refund}</button>
      </form>
    </AdminSection>
  );
}
