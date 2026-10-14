import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminFilters, AdminNotice, AdminPager, AdminSection, adminWhen } from "@/components/admin/frame";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { loadDomains } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).admin.navDomains, robots: { index: false, follow: false } };
}

export default async function DomainsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <Domains locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Domains({ locale, searchParams }: { locale: Locale; searchParams: PageProps["searchParams"] }) {
  const dict = getDictionary(locale);
  const query = await searchParams;
  const list = await loadDomains({ q: first(query.q), status: first(query.status), page: first(query.page) });
  if ("denied" in list) {
    return <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription} />;
  }
  if ("failed" in list) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }
  const copy = dict.admin;
  const statuses = [
    { value: "pending", label: dict.billing.statuses.pending },
    { value: "verified", label: dict.insights.statuses.verified },
    { value: "active", label: dict.billing.statuses.active },
    { value: "disabled", label: copy.businessStatuses.archived },
  ];
  return (
    <AdminSection title={copy.navDomains}>
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <AdminFilters locale={locale} path="domains" copy={copy} q={list.term} status={list.status} statuses={statuses} />
      {list.rows.length === 0 ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.empty}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-start dark:border-zinc-800">
                <th className="px-2 py-2 font-medium">{copy.columns.domain}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.business}</th>
                <th className="px-2 py-2 font-medium">{copy.status}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.when}</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="px-2 py-3">{row.hostname}</td>
                  <td className="px-2 py-3">{row.businessName || copy.empty}</td>
                  <td className="px-2 py-3">{row.status}</td>
                  <td className="px-2 py-3">{adminWhen(row.created_at, locale, dict.billing.openEnded)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPager locale={locale} path="domains" copy={copy} page={list.page} total={list.total} pageSize={list.pageSize} q={list.term} status={list.status} />
    </AdminSection>
  );
}
