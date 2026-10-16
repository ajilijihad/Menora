import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FinanceDashboard, FinanceFilters } from "@/components/admin/analytics-dashboard";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { utcDay } from "@/lib/analytics/collect";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { loadAdminFinance } from "@/modules/admin/finance";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).admin.navAnalytics, robots: { index: false, follow: false } };
}

export default function AnalyticsPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState /></main>}>
      <AnalyticsContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function AnalyticsContent({
  params,
  searchParams,
}: {
  params: PageProps["params"];
  searchParams: PageProps["searchParams"];
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  await connection();
  const dict = getDictionary(locale);
  const copy = dict.admin;
  const studio = copy.analyticsPage;
  const query = await searchParams;
  const now = new Date();
  const result = await loadAdminFinance({
    range: first(query.range),
    from: first(query.from),
    to: first(query.to),
    now,
  });
  if ("denied" in result) {
    return <StatusPanel title={copy.deniedTitle} description={copy.deniedDescription} />;
  }
  if ("failed" in result) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{copy.navAnalytics}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{studio.description}</p>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted">{studio.note}</p>
        </div>
        <FinanceFilters copy={studio} locale={locale as Locale} preset={result.preset} from={result.from} to={result.to} today={utcDay(now)} calendar={dict.calendar} />
      </header>
      <FinanceDashboard copy={studio} locale={locale} report={result} />
    </main>
  );
}
