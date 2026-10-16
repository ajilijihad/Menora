import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, RotateCcw, Search, Store } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminNotice, adminWhen } from "@/components/admin/frame";
import { CopyValue } from "@/components/admin/copy-value";
import { RefundSubmit } from "@/components/admin/refund-submit";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { adminHref } from "@/lib/admin/list";
import { formatMoney } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { refundPaymentFormAction } from "@/modules/admin/actions";
import { loadPayments } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "canceled";

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15";

const statusTone: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  refunded: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  canceled: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

const statusDot: Record<PaymentStatus, string> = {
  pending: "bg-amber-500",
  completed: "bg-emerald-500",
  failed: "bg-rose-500",
  refunded: "bg-sky-500",
  canceled: "bg-slate-400",
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
  const pathname = `/${locale}/admin/payments`;
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const from = list.total === 0 ? 0 : (list.page - 1) * list.pageSize + 1;
  const to = Math.min(list.page * list.pageSize, list.total);
  const statuses = (["pending", "completed", "failed", "refunded", "canceled"] as const).map((value) => ({
    value,
    label: dict.billing.paymentStatuses[value],
  }));
  const previousHref = adminHref(pathname, { q: list.term, status: list.status, page: list.page - 1 });
  const nextHref = adminHref(pathname, { q: list.term, status: list.status, page: list.page + 1 });

  return (
    <main className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-5 px-4 py-6 lg:px-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{copy.navPayments}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{copy.paymentNote}</p>
      </div>
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <form action={pathname} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-end">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{copy.search}</span>
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input name="q" defaultValue={list.term} placeholder={copy.paymentsSearch} className={`${fieldClassName} ps-10`} />
        </label>
        <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-foreground sm:w-44">
          {copy.status}
          <Select
            name="status"
            defaultValue={list.status ?? "all"}
            options={[{ value: "all", label: copy.all }, ...statuses]}
            className={fieldClassName}
          />
        </label>
        <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto">
          {copy.apply}
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {list.rows.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">{copy.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-brand/[0.04] text-start">
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.business}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.amount}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.status}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.reference}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.order}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.when}</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => {
                  const amount = formatMoney(row.amount_cents, row.currency, locale);
                  return (
                    <tr key={row.id} className="border-b border-line transition-colors last:border-b-0 hover:bg-surface-muted/60">
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2.5 text-foreground">
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
                            <Store className="size-4" aria-hidden="true" />
                          </span>
                          <span>{row.businessName || "—"}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">{amount ? `${amount} ${row.currency}` : "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[row.status]}`}>
                          <span className={`size-1.5 rounded-full ${statusDot[row.status]}`} aria-hidden="true" />
                          {dict.billing.paymentStatuses[row.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Reference value={row.provider_capture_id} label={copy.paymentsCopy} copiedLabel={copy.subscriptionsPage.copied} />
                      </td>
                      <td className="px-5 py-4">
                        <Reference value={row.provider_order_id} label={copy.paymentsCopy} copiedLabel={copy.subscriptionsPage.copied} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted">{adminWhen(row.paid_at ?? row.created_at, locale, dict.billing.openEnded)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-line px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">{copy.subscriptionsPage.showing.replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(list.total))}</p>
          <div className="flex items-center gap-2">
            <span className="text-muted">{copy.subscriptionsPage.perPage.replace("{count}", String(list.pageSize))}</span>
            {list.page > 1 ? (
              <Link href={previousHref} aria-label={copy.previous} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            ) : (
              <span aria-disabled="true" className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted opacity-40">
                <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              </span>
            )}
            <span aria-current="page" className="inline-flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-medium text-white">{list.page}</span>
            {list.page < pages ? (
              <Link href={nextHref} aria-label={copy.next} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            ) : (
              <span aria-disabled="true" className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted opacity-40">
                <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </span>
            )}
          </div>
        </div>
      </section>

      <form action={refundPaymentFormAction} className="grid w-full gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <RotateCcw className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">{copy.refund}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{dict.billing.refundDescription}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {dict.billing.paymentId}
            <input name="paymentId" required placeholder={copy.paymentsIdPlaceholder} className={fieldClassName} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {copy.reason}
            <input name="reason" required minLength={8} maxLength={500} placeholder={copy.paymentsReasonPlaceholder} className={fieldClassName} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox name="confirm" value="yes" required />
          {copy.confirm}
        </label>
        <input type="hidden" name="locale" value={locale} />
        <RefundSubmit label={copy.refund} />
      </form>
    </main>
  );
}

function Reference({ value, label, copiedLabel }: { value: string | null; label: string; copiedLabel: string }) {
  if (!value) {
    return <span className="text-muted">—</span>;
  }
  return (
    <span className="inline-flex max-w-48 items-center gap-1">
      <span title={value} className="truncate font-mono text-xs text-muted">{value}</span>
      <CopyValue value={value} label={label} copiedLabel={copiedLabel} />
    </span>
  );
}
