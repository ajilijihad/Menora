import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminFilters, AdminNotice, AdminPager, AdminSection, adminWhen } from "@/components/admin/frame";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { loadEmailLogs } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).admin.navEmails, robots: { index: false, follow: false } };
}

export default async function EmailLogsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <EmailLogs locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function EmailLogs({ locale, searchParams }: { locale: Locale; searchParams: PageProps["searchParams"] }) {
  const dict = getDictionary(locale);
  const query = await searchParams;
  const list = await loadEmailLogs({ q: first(query.q), status: first(query.status), page: first(query.page) });
  if ("denied" in list) {
    return <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription} />;
  }
  if ("failed" in list) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }
  const copy = dict.admin;
  const statuses = [
    { value: "queued", label: copy.queued },
    { value: "sent", label: copy.sent },
    { value: "failed", label: copy.failed },
  ];
  return (
    <AdminSection title={copy.navEmails}>
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <AdminFilters locale={locale} path="emails" copy={copy} q={list.term} status={list.status} statuses={statuses} />
      {list.rows.length === 0 ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.empty}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-start dark:border-zinc-800">
                <th className="px-2 py-2 font-medium">{copy.columns.email}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.template}</th>
                <th className="px-2 py-2 font-medium">{copy.status}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.provider}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.when}</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="px-2 py-3">{row.to_email}</td>
                  <td className="px-2 py-3">{row.template}</td>
                  <td className="px-2 py-3">{row.status === "queued" ? copy.queued : row.status === "sent" ? copy.sent : copy.failed}</td>
                  <td className="px-2 py-3">{row.provider_message_id || row.error_message || copy.empty}</td>
                  <td className="px-2 py-3">{adminWhen(row.created_at, locale, dict.billing.openEnded)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPager locale={locale} path="emails" copy={copy} page={list.page} total={list.total} pageSize={list.pageSize} q={list.term} status={list.status} />
    </AdminSection>
  );
}
