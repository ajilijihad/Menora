import { ArrowDownRight, ArrowUpRight, Banknote, CalendarDays, Download, RotateCcw, Wallet, XCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { RevenueChart } from "@/components/admin/revenue-chart";
import { signedAdminMoney, type AdminPreset } from "@/lib/admin/overview";
import { inclusiveDays, sharePercent } from "@/lib/analytics/present";
import type { AdminCopy } from "@/lib/i18n/admin-copy";
import type { Locale } from "@/lib/i18n/locales";
import type { AdminFinance, MoneyTotal } from "@/modules/admin/finance";

const cardClassName = "rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5";

type Studio = AdminCopy["analyticsPage"];

export function FinanceDashboard({
  copy,
  locale,
  report,
}: {
  copy: Studio;
  locale: Locale;
  report: AdminFinance;
}) {
  const numbers = new Intl.NumberFormat(locale);
  const compare = copy.vsPrevious.replace("{count}", numbers.format(report.span));
  const base = `/${locale}/admin/payments`;
  const chartSeries = report.series?.map((line) => ({ currency: line.currency, collected: line.collected })) ?? null;
  const hasCollected = chartSeries?.some((line) => line.collected.some((amount) => amount > 0)) ?? false;
  const visibleRows = [...report.rows].reverse();

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MoneyCard
          label={copy.collected}
          hint={copy.collectedHint}
          rows={report.collected}
          none={copy.none}
          unavailable={copy.unavailable}
          change={report.collectedChange}
          compare={compare}
          locale={locale}
          icon={<Banknote className="size-5" aria-hidden="true" />}
          color="#FF5A24"
        />
        <MoneyCard
          label={copy.refunds}
          hint={copy.refundsHint}
          rows={report.refunded}
          none={copy.none}
          unavailable={copy.unavailable}
          change={report.refundedChange}
          compare={compare}
          invert
          locale={locale}
          icon={<RotateCcw className="size-5" aria-hidden="true" />}
          color="#F59E0B"
        />
        <MoneyCard
          label={copy.net}
          hint={copy.netHint}
          rows={report.net}
          none={copy.none}
          unavailable={copy.unavailable}
          change={report.netChange}
          compare={compare}
          locale={locale}
          icon={<Wallet className="size-5" aria-hidden="true" />}
          color="#10B981"
        />
        <article className={cardClassName}>
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-300">
            <XCircle className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm text-muted">{copy.failed}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{numbers.format(report.counts.failed)}</p>
          <p className="mt-1 text-xs text-muted">{copy.failedHint}</p>
          {report.failedChange !== null ? <Change value={report.failedChange} compare={compare} invert /> : null}
        </article>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
        <article className={cardClassName}>
          <h2 className="text-base font-semibold text-foreground">{copy.chartTitle}</h2>
          <p className="mt-1 text-sm text-muted">{copy.chartHint}</p>
          {chartSeries && hasCollected ? (
            <div className="mt-4">
              <RevenueChart days={report.days} series={chartSeries} locale={locale} collectedLabel={copy.collected} refundedLabel={copy.refunds} />
            </div>
          ) : (
            <p className="mt-8 mb-4 text-sm text-muted">{chartSeries ? copy.chartEmpty : copy.unavailable}</p>
          )}
        </article>
        <article className={cardClassName}>
          <h2 className="text-base font-semibold text-foreground">{copy.plansTitle}</h2>
          <PlanList copy={copy} locale={locale} report={report} numbers={numbers} />
        </article>
      </section>

      <section className={cardClassName}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">{copy.outcomes}</h2>
          <Link href={base} className="text-sm font-medium text-brand hover:underline">{copy.openPayments}</Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Outcome href={`${base}?status=completed`} label={copy.completed} value={numbers.format(report.counts.completed)} />
          <Outcome href={`${base}?status=pending`} label={copy.pending} value={numbers.format(report.counts.pending)} />
          <Outcome href={`${base}?status=failed`} label={copy.failed} value={numbers.format(report.counts.failed)} />
          <Outcome href={`${base}?status=refunded`} label={copy.refunded} value={numbers.format(report.counts.refunded)} />
        </div>
      </section>

      <section className={cardClassName}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{copy.dailyTitle}</h2>
            <p className="mt-1 text-sm text-muted">{copy.dailyHint}</p>
          </div>
          {report.series ? (
            <a href={`/${locale}/admin/analytics/export?from=${report.from}&to=${report.to}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:bg-surface-muted">
              <Download className="size-4" aria-hidden="true" />
              {copy.exportCsv}
            </a>
          ) : null}
        </div>
        {report.series && visibleRows.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="px-3 py-2 text-start font-medium">{copy.date}</th>
                  <th className="px-3 py-2 text-start font-medium">{copy.currency}</th>
                  <th className="px-3 py-2 text-end font-medium">{copy.collected}</th>
                  <th className="px-3 py-2 text-end font-medium">{copy.refunds}</th>
                  <th className="px-3 py-2 text-end font-medium">{copy.net}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={`${row.day}:${row.currency}`} className="border-b border-line/70">
                    <td className="px-3 py-2.5">{formatDay(row.day, locale)}</td>
                    <td className="px-3 py-2.5">{row.currency}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums">{signedAdminMoney(row.collectedCents, row.currency, locale)}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums">{signedAdminMoney(row.refundedCents, row.currency, locale)}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums">{signedAdminMoney(row.collectedCents - row.refundedCents, row.currency, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">{report.series ? copy.chartEmpty : copy.unavailable}</p>
        )}
      </section>
    </div>
  );
}

export function FinanceFilters({
  copy,
  locale,
  preset,
  from,
  to,
  today,
}: {
  copy: Studio;
  locale: Locale;
  preset: AdminPreset;
  from: string;
  to: string;
  today: string;
}) {
  const base = `/${locale}/admin/analytics`;
  return (
    <div className="flex flex-col gap-2 lg:items-end">
      <div className="flex flex-wrap gap-2">
        {([7, 30, 90] as const).map((days) => {
          const label = days === 7 ? copy.days7 : days === 30 ? copy.days30 : copy.days90;
          const active = preset === days && inclusiveDays(from, to) === days && to === today;
          return (
            <Link
              key={days}
              href={`${base}?range=${days}`}
              aria-current={active ? "true" : undefined}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${active ? "border-brand bg-brand/10 text-brand" : "border-line bg-surface text-foreground"}`}
            >
              {days === 30 ? <CalendarDays className="size-4" aria-hidden="true" /> : null}
              {label}
            </Link>
          );
        })}
      </div>
      <form className="flex flex-wrap items-center gap-2" method="get">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1">
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">{copy.from}</span>
            <input className="h-9 bg-transparent text-sm text-foreground outline-none [color-scheme:inherit]" type="date" name="from" defaultValue={from} max={today} required />
          </label>
          <span className="text-muted" aria-hidden="true">–</span>
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">{copy.to}</span>
            <input className="h-9 bg-transparent text-sm text-foreground outline-none [color-scheme:inherit]" type="date" name="to" defaultValue={to} max={today} required />
          </label>
        </div>
        <button className="h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover" type="submit">{copy.apply}</button>
      </form>
    </div>
  );
}

function MoneyCard({
  label,
  hint,
  rows,
  none,
  unavailable,
  change,
  compare,
  invert = false,
  locale,
  icon,
  color,
}: {
  label: string;
  hint: string;
  rows: MoneyTotal[] | null;
  none: string;
  unavailable: string;
  change: number | null;
  compare: string;
  invert?: boolean;
  locale: Locale;
  icon: ReactNode;
  color: string;
}) {
  return (
    <article className={cardClassName}>
      <span className="inline-flex size-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}1A`, color }}>{icon}</span>
      <p className="mt-3 text-sm text-muted">{label}</p>
      {rows === null ? <p className="mt-2 text-sm text-muted">{unavailable}</p> : null}
      {rows?.length === 0 ? <p className="mt-2 text-lg font-semibold text-foreground">{none}</p> : null}
      {rows && rows.length > 0 ? (
        <div className="mt-1 flex flex-col gap-1">
          {rows.map((row) => (
            <p key={row.currency} className="text-2xl font-semibold tabular-nums text-foreground">{signedAdminMoney(row.amountCents, row.currency, locale)}</p>
          ))}
        </div>
      ) : null}
      <p className="mt-1 text-xs text-muted">{hint}</p>
      {change !== null ? <Change value={change} compare={compare} invert={invert} /> : null}
    </article>
  );
}

function Change({ value, compare, invert = false }: { value: number; compare: string; invert?: boolean }) {
  const positive = invert ? value < 0 : value >= 0;
  return (
    <p className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${positive ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}`}>
      {value >= 0 ? <ArrowUpRight className="size-4" aria-hidden="true" /> : <ArrowDownRight className="size-4" aria-hidden="true" />}
      {Math.abs(value)}%
      <span className="font-normal text-muted">{compare}</span>
    </p>
  );
}

function PlanList({
  copy,
  locale,
  report,
  numbers,
}: {
  copy: Studio;
  locale: Locale;
  report: AdminFinance;
  numbers: Intl.NumberFormat;
}) {
  if (!report.plans) {
    return <p className="mt-6 text-sm text-muted">{copy.unavailable}</p>;
  }
  if (report.plans.length === 0) {
    return <p className="mt-6 text-sm text-muted">{copy.plansEmpty}</p>;
  }
  const totals = new Map<string, number>();
  for (const plan of report.plans) {
    totals.set(plan.currency, (totals.get(plan.currency) ?? 0) + plan.amountCents);
  }
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {report.plans.map((plan) => {
        const name = plan.name.trim() || copy.unassignedPlan;
        return (
          <li key={`${plan.planId ?? "none"}:${plan.currency}`} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{name}</span>
              <span className="text-xs text-muted">{numbers.format(plan.payments)} {copy.payments}</span>
            </span>
            <span className="text-end">
              <span className="block text-sm font-semibold tabular-nums text-foreground">{signedAdminMoney(plan.amountCents, plan.currency, locale)}</span>
              <span className="text-xs tabular-nums text-muted">{sharePercent(plan.amountCents, totals.get(plan.currency) ?? 0)}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Outcome({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="rounded-xl border border-line px-3 py-3 transition hover:bg-surface-muted">
      <span className="block text-xs text-muted">{label}</span>
      <span className="mt-1 block text-xl font-semibold tabular-nums text-foreground">{value}</span>
    </Link>
  );
}

function formatDay(day: string, locale: Locale): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return day;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
