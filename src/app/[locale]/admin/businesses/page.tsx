import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminFilters, AdminNotice, AdminPager, AdminSection, adminFieldClassName } from "@/components/admin/frame";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel, statusActionClassName } from "@/components/states/status-panel";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { suspendBusinessFormAction } from "@/modules/admin/actions";
import { loadBusinesses } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).admin.navBusinesses, robots: { index: false, follow: false } };
}

export default async function BusinessesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <Businesses locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Businesses({ locale, searchParams }: { locale: Locale; searchParams: PageProps["searchParams"] }) {
  const dict = getDictionary(locale);
  const query = await searchParams;
  const list = await loadBusinesses({ q: first(query.q), status: first(query.status), page: first(query.page) });
  if ("denied" in list) {
    return <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription} />;
  }
  if ("failed" in list) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }
  const copy = dict.admin;
  const statuses = [
    { value: "draft", label: copy.businessStatuses.draft },
    { value: "active", label: copy.businessStatuses.active },
    { value: "archived", label: copy.businessStatuses.archived },
    { value: "suspended", label: copy.businessStatuses.suspended },
  ];

  return (
    <AdminSection title={copy.navBusinesses}>
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <AdminFilters locale={locale} path="businesses" copy={copy} q={list.term} status={list.status} statuses={statuses} />
      {list.rows.length === 0 ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.empty}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-start dark:border-zinc-800">
                <th className="px-2 py-2 font-medium">{copy.columns.business}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.owner}</th>
                <th className="px-2 py-2 font-medium">{copy.status}</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="px-2 py-3">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-zinc-500">{row.slug}</p>
                  </td>
                  <td className="px-2 py-3">{row.owner?.full_name || row.owner?.email || copy.empty}</td>
                  <td className="px-2 py-3">{row.suspended_at ? copy.businessStatuses.suspended : copy.businessStatuses[row.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPager locale={locale} path="businesses" copy={copy} page={list.page} total={list.total} pageSize={list.pageSize} q={list.term} status={list.status} />
      <form action={suspendBusinessFormAction} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          {copy.recordId}
          <input name="businessId" required className={adminFieldClassName} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          {copy.operation}
          <Select
            name="mode"
            options={[{ value: "suspend", label: copy.suspend }, { value: "reactivate", label: copy.reactivate }]}
            className={`${adminFieldClassName} w-full`}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
          {copy.reason}
          <input name="reason" required minLength={8} maxLength={500} className={adminFieldClassName} />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox name="confirm" value="yes" required />
          {copy.confirm}
        </label>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className={statusActionClassName}>{copy.applyChange}</button>
      </form>
    </AdminSection>
  );
}
