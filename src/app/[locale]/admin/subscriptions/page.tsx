import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminNotice } from "@/components/admin/frame";
import { SubscriptionsManager } from "@/components/admin/subscriptions-manager";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { loadSubscriptions } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).admin.navSubscriptions, robots: { index: false, follow: false } };
}

export default async function SubscriptionsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <Subscriptions locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Subscriptions({ locale, searchParams }: { locale: Locale; searchParams: PageProps["searchParams"] }) {
  const dict = getDictionary(locale);
  const query = await searchParams;
  const list = await loadSubscriptions({ q: first(query.q), status: first(query.status), page: first(query.page), size: first(query.size) });
  if ("denied" in list) {
    return <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription} />;
  }
  if ("failed" in list) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
      <AdminNotice copy={dict.admin} notice={first(query.notice)} />
      <SubscriptionsManager
        locale={locale}
        copy={dict.admin}
        statusLabels={dict.billing.statuses}
        rows={list.rows}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        term={list.term}
        status={list.status}
        summary={list.summary}
      />
    </main>
  );
}
