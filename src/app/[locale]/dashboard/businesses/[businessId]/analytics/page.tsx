import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Download, Eye, Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { DailyChart } from "@/components/analytics/daily-chart";
import { DonutChart } from "@/components/analytics/donut-chart";
import { Sparkline } from "@/components/analytics/sparkline";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { inclusiveDays, periodChange, previousWindow, sharePercent } from "@/lib/analytics/present";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { InsightsCopy } from "@/lib/i18n/insights-copy";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { loadAnalyticsSummary, type AnalyticsSlice, type AnalyticsSummary } from "@/modules/analytics/queries";
import { getMyBusiness } from "@/modules/businesses/queries";

type PageProps = {
  params: Promise<{ locale: string; businessId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const deviceOrder = ["desktop", "mobile", "tablet", "unknown"] as const;
const sourceOrder = ["direct", "search", "social", "other"] as const;

const deviceColors: Record<(typeof deviceOrder)[number], string> = {
  desktop: "#FF5A24",
  mobile: "#FDBA74",
  tablet: "#FDE68A",
  unknown: "#94A3B8",
};

const sourceColors: Record<(typeof sourceOrder)[number], string> = {
  direct: "#FF5A24",
  search: "#3B82F6",
  social: "#8B5CF6",
  other: "#F59E0B",
};

const cardClassName = "rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]";
const dateInputClassName =
  "h-10 bg-transparent text-sm text-foreground outline-none [color-scheme:inherit]";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).insights.analytics, robots: { index: false, follow: false } };
}

export default function AnalyticsPage({ params, searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col justify-center">
          <LoadingState />
        </main>
      }
    >
      <AnalyticsContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function formatDay(day: string, locale: Locale): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return day;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function shiftDay(day: string, delta: number): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) + delta * 86400000).toISOString().slice(0, 10);
}

function orderedSlices(rows: AnalyticsSlice[], keys: readonly string[]): AnalyticsSlice[] {
  const counts = new Map(rows.map((row) => [row.key, row.views]));
  return keys.map((key) => ({ key, views: counts.get(key) ?? 0 }));
}

async function AnalyticsContent({
  params,
  searchParams,
}: {
  params: PageProps["params"];
  searchParams: PageProps["searchParams"];
}) {
  const { locale, businessId } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const business = await getMyBusiness(businessId);
  if (!business) {
    notFound();
  }

  const query = await searchParams;
  const requestedFrom = first(query.from);
  const requestedTo = first(query.to);
  const dict = getDictionary(locale);
  const copy = dict.insights;
  const result = await loadAnalyticsSummary(businessId, requestedFrom, requestedTo);
  if (!result.ok) {
    if (result.reason === "invalid") {
      return (
        <main className="flex flex-col gap-5">
          <Header
            copy={copy}
            locale={locale}
            businessId={businessId}
            from={requestedFrom && /^\d{4}-\d{2}-\d{2}$/.test(requestedFrom) ? requestedFrom : result.visibleFrom}
            to={requestedTo && /^\d{4}-\d{2}-\d{2}$/.test(requestedTo) ? requestedTo : result.today}
            visibleFrom={result.visibleFrom}
            today={result.today}
            retentionDays={0}
            invalid
          />
        </main>
      );
    }

    if (result.reason === "denied") {
      notFound();
    }

    return (
      <main>
        <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />
      </main>
    );
  }

  const previous = previousWindow(result.pageFrom, result.pageTo);
  const prior = previous ? await loadAnalyticsSummary(businessId, previous.from, previous.to) : null;
  const comparable = Boolean(prior?.ok && previous && prior.pageFrom === previous.from && prior.pageTo === previous.to);
  const menuChange = comparable && prior?.ok ? periodChange(result.summary.menuViews, prior.summary.menuViews) : null;
  const productChange = comparable && prior?.ok ? periodChange(result.summary.productViews, prior.summary.productViews) : null;
  const span = inclusiveDays(result.pageFrom, result.pageTo);
  const numbers = new Intl.NumberFormat(locale);
  const base = `/${locale}/dashboard/businesses/${businessId}/analytics`;
  const page = Math.max(1, Number(first(query.page) ?? "1") || 1);
  const pageSize = 31;
  const days = result.summary.days;
  const pageCount = Math.max(1, Math.ceil(days.length / pageSize));
  const current = Math.min(page, pageCount);
  const visibleDays = days.slice((current - 1) * pageSize, current * pageSize);
  const hasViews = result.summary.menuViews + result.summary.productViews > 0;
  const exportHref = `${base}/export?from=${result.pageFrom}&to=${result.pageTo}`;

  return (
    <main className="flex flex-col gap-5">
      <Header
        copy={copy}
        locale={locale}
        businessId={businessId}
        from={result.pageFrom}
        to={result.pageTo}
        visibleFrom={result.visibleFrom}
        today={result.today}
        retentionDays={result.retentionDays}
        invalid={false}
      />
      <section className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label={copy.menuViews}
          value={numbers.format(result.summary.menuViews)}
          change={menuChange}
          compare={fill(copy.vsPrevious, { count: span })}
          color="#FF5A24"
          icon={<Eye className="size-5" />}
          series={days.map((day) => day.menu)}
        />
        <MetricCard
          label={copy.productViews}
          value={numbers.format(result.summary.productViews)}
          change={productChange}
          compare={fill(copy.vsPrevious, { count: span })}
          color="#8B5CF6"
          icon={<Package className="size-5" />}
          series={days.map((day) => day.product)}
        />
      </section>
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)]">
        <article className={cardClassName}>
          <h2 className="text-lg font-semibold">{copy.byDay}</h2>
          {hasViews ? (
            <div className="mt-4">
              <DailyChart days={days} menuLabel={copy.menuViews} productLabel={copy.productViews} locale={locale} />
            </div>
          ) : (
            <p className="mt-8 mb-6 text-sm text-muted">{copy.empty}</p>
          )}
        </article>
        <BreakdownCard
          title={copy.byDevice}
          note={copy.deviceNote}
          empty={copy.breakdownEmpty}
          rows={orderedSlices(result.summary.devices, deviceOrder).filter((row) => row.key !== "unknown" || row.views > 0)}
          colors={deviceColors}
          labels={copy.devices}
        />
      </section>
      <section className="grid items-start gap-4 lg:grid-cols-3">
        <BreakdownCard
          title={copy.byReferrer}
          note={copy.sourceNote}
          empty={copy.breakdownEmpty}
          rows={orderedSlices(result.summary.referrers, sourceOrder)}
          colors={sourceColors}
          labels={copy.sources}
        />
        <RankCard
          title={copy.products}
          rows={result.summary.products}
          emptyTitle={copy.productsEmptyTitle}
          emptyBody={copy.productsEmptyBody}
          viewsLabel={copy.views}
          numbers={numbers}
        />
        <RankCard
          title={copy.categories}
          rows={result.summary.categories}
          emptyTitle={copy.categoriesEmptyTitle}
          emptyBody={copy.categoriesEmptyBody}
          viewsLabel={copy.views}
          numbers={numbers}
        />
      </section>
      <DailyTable
        copy={copy}
        locale={locale}
        summary={result.summary}
        rows={visibleDays}
        numbers={numbers}
        exportHref={exportHref}
        page={current}
        pageCount={pageCount}
        hrefFor={(nextPage) => `${base}?from=${result.pageFrom}&to=${result.pageTo}&page=${nextPage}`}
      />
    </main>
  );
}

function Header({
  copy,
  locale,
  businessId,
  from,
  to,
  visibleFrom,
  today,
  retentionDays,
  invalid,
}: {
  copy: InsightsCopy;
  locale: Locale;
  businessId: string;
  from: string;
  to: string;
  visibleFrom: string;
  today: string;
  retentionDays: number;
  invalid: boolean;
}) {
  const ranges = [7, 30, 90].filter((days) => retentionDays >= days);
  const base = `/${locale}/dashboard/businesses/${businessId}/analytics`;

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.analytics}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{copy.analyticsDescription}</p>
        <p className="mt-1 text-sm text-muted">
          {copy.retention} {formatDay(visibleFrom, locale)}
        </p>
        <p className="mt-1 text-xs text-muted">{copy.privacy}</p>
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <form key={`${from}:${to}`} className="flex flex-wrap items-center gap-2" method="get">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-1 shadow-[var(--shadow-card)]">
            <CalendarDays className="size-4 text-muted" aria-hidden="true" />
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">{copy.from}</span>
              <input className={dateInputClassName} type="date" name="from" defaultValue={from} min={visibleFrom} max={today} required />
            </label>
            <span className="text-muted" aria-hidden="true">–</span>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">{copy.to}</span>
              <input className={dateInputClassName} type="date" name="to" defaultValue={to} min={visibleFrom} max={today} required />
            </label>
          </div>
          <button className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover" type="submit">
            {copy.apply}
          </button>
        </form>
        {invalid ? <p className="text-sm text-red-600 dark:text-red-300">{copy.rangeInvalid}</p> : null}
        {ranges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {ranges.map((days) => {
              const start = shiftDay(today, -(days - 1));
              const rangeFrom = start < visibleFrom ? visibleFrom : start;
              const active = from === rangeFrom && to === today;
              return (
                <Link
                  key={days}
                  href={`${base}?from=${rangeFrom}&to=${today}`}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${active ? "border-brand bg-orange-500/10 text-brand" : "border-line text-muted"}`}
                  aria-current={active ? "true" : undefined}
                >
                  {days === 7 ? copy.days7 : days === 30 ? copy.days30 : copy.days90}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </header>
  );
}

function MetricCard({
  label,
  value,
  change,
  compare,
  color,
  icon,
  series,
}: {
  label: string;
  value: string;
  change: number | null;
  compare: string;
  color: string;
  icon: ReactNode;
  series: number[];
}) {
  return (
    <article className={cardClassName}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}1A`, color }}>
            {icon}
          </span>
          <p className="mt-3 text-sm text-muted">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
          {change !== null ? (
            <p className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${change >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}`}>
              {change >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
              {Math.abs(change)}%
              <span className="font-normal text-muted">{compare}</span>
            </p>
          ) : null}
        </div>
        <Sparkline values={series.length > 0 ? series : [0]} color={color} />
      </div>
    </article>
  );
}

function BreakdownCard({
  title,
  note,
  empty,
  rows,
  colors,
  labels,
}: {
  title: string;
  note: string;
  empty: string;
  rows: AnalyticsSlice[];
  colors: Record<string, string>;
  labels: Record<string, string>;
}) {
  const total = rows.reduce((sum, row) => sum + row.views, 0);
  const slices = rows.map((row) => ({
    label: labels[row.key] ?? row.key,
    value: row.views,
    color: colors[row.key] ?? "#94A3B8",
    percent: `${sharePercent(row.views, total)}%`,
  }));

  return (
    <article className={cardClassName}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-muted">{note}</p>
      {total > 0 ? (
        <div className="mt-4">
          <DonutChart slices={slices} total={total} label={title} />
        </div>
      ) : (
        <p className="mt-8 mb-4 text-sm text-muted">{empty}</p>
      )}
    </article>
  );
}

function RankCard({
  title,
  rows,
  emptyTitle,
  emptyBody,
  viewsLabel,
  numbers,
}: {
  title: string;
  rows: AnalyticsSummary["products"];
  emptyTitle: string;
  emptyBody: string;
  viewsLabel: string;
  numbers: Intl.NumberFormat;
}) {
  return (
    <article className={cardClassName}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <div className="mt-8 mb-4 text-center">
          <p className="font-medium">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{emptyBody}</p>
        </div>
      ) : (
        <ol className="mt-4 flex max-h-72 flex-col gap-2 overflow-auto">
          {rows.map((row, index) => (
            <li key={row.id || row.name} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">{index + 1}</span>
                <span className="truncate text-sm font-medium">{row.name}</span>
              </span>
              <span className="shrink-0 text-sm tabular-nums text-muted">
                {numbers.format(row.views)} <span className="sr-only">{viewsLabel}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function DailyTable({
  copy,
  locale,
  summary,
  rows,
  numbers,
  exportHref,
  page,
  pageCount,
  hrefFor,
}: {
  copy: InsightsCopy;
  locale: Locale;
  summary: AnalyticsSummary;
  rows: AnalyticsSummary["days"];
  numbers: Intl.NumberFormat;
  exportHref: string;
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  return (
    <section className={cardClassName}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{copy.dailyTitle}</h2>
        <a href={exportHref} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium hover:bg-surface-muted">
          <Download className="size-4" aria-hidden="true" />
          {copy.exportCsv}
        </a>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-line text-start text-muted">
              <th className="px-3 py-2 font-medium">{copy.day}</th>
              <th className="px-3 py-2 text-end font-medium">{copy.menuViews}</th>
              <th className="px-3 py-2 text-end font-medium">{copy.productViews}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((day) => (
              <tr key={day.day} className="border-b border-line/80 transition hover:bg-surface-muted">
                <td className="px-3 py-2.5">{formatDay(day.day, locale)}</td>
                <td className="px-3 py-2.5 text-end tabular-nums">{numbers.format(day.menu)}</td>
                <td className="px-3 py-2.5 text-end tabular-nums">{numbers.format(day.product)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {summary.days.length === 0 ? <p className="mt-4 text-sm text-muted">{copy.empty}</p> : null}
      {pageCount > 1 ? (
        <nav className="mt-4 flex gap-4 text-sm">
          {page > 1 ? <Link href={hrefFor(page - 1)}>{copy.previous}</Link> : null}
          {page < pageCount ? <Link href={hrefFor(page + 1)}>{copy.next}</Link> : null}
        </nav>
      ) : null}
    </section>
  );
}
