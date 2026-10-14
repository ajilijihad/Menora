import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminNotice } from "@/components/admin/frame";
import { PlansManager } from "@/components/admin/plans-manager";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { allowedFilter } from "@/lib/admin/list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { isCurrencyCode } from "@/lib/menus/money";
import { loadPlans, loadPlanSummary } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).admin.navPlans, robots: { index: false, follow: false } };
}

export default async function PlansPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <Plans locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Plans({ locale, searchParams }: { locale: Locale; searchParams: PageProps["searchParams"] }) {
  const dict = getDictionary(locale);
  const query = await searchParams;
  const currency = first(query.currency);
  const [list, summary] = await Promise.all([
    loadPlans({
      q: first(query.q),
      page: first(query.page),
      status: first(query.status),
      currency: isCurrencyCode(currency ?? "") ? currency : undefined,
    }),
    loadPlanSummary(),
  ]);
  if ("denied" in list || "denied" in summary) {
    return <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription} />;
  }
  if ("failed" in list) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }
  const copy = dict.admin;
  const metrics = "failed" in summary
    ? { activePlans: null, subscribers: null, revenue: null, currencies: [] }
    : summary;
  const status = allowedFilter(list.status, ["active", "draft"]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <PlansManager
        locale={locale}
        copy={copy}
        plans={list.rows}
        total={list.total}
        pageSize={list.pageSize}
        counts={list.counts}
        filters={{ q: list.term, status, currency: list.currency, page: list.page }}
        summary={metrics}
      />
    </main>
  );
}
