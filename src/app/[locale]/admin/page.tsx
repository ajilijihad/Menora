import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminNotice } from "@/components/admin/frame";
import { OverviewDashboard } from "@/components/admin/overview-dashboard";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { utcDay } from "@/lib/analytics/collect";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";
import { loadAdminOverview } from "@/modules/admin/queries";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: AdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).admin.title, robots: { index: false, follow: false } };
}

export default function AdminPage({ params, searchParams }: AdminPageProps) {
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState /></main>}>
      <Overview params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Overview({
  params,
  searchParams,
}: {
  params: AdminPageProps["params"];
  searchParams: AdminPageProps["searchParams"];
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  await connection();
  const dict = getDictionary(locale);
  const query = await searchParams;
  const notice = first(query.notice);
  const now = new Date();
  const overview = await loadAdminOverview({
    range: first(query.range),
    from: first(query.from),
    to: first(query.to),
    now,
  });
  if ("denied" in overview) {
    return <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription} />;
  }
  if ("failed" in overview) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }

  return (
    <>
      {notice ? (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
          <AdminNotice copy={dict.admin} notice={notice} />
        </div>
      ) : null}
      <OverviewDashboard locale={locale} copy={dict.admin} statuses={dict.billing.statuses} overview={overview} calendar={dict.calendar} today={utcDay(now)} />
    </>
  );
}
