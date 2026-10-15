import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminFilters, AdminNotice, AdminPager, AdminSection, adminFieldClassName, adminWhen } from "@/components/admin/frame";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel, statusActionClassName } from "@/components/states/status-panel";
import { formatAdminMoney } from "@/lib/admin/overview";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { grantPlanFormAction } from "@/modules/admin/actions";
import { loadUsers } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).admin.navUsers, robots: { index: false, follow: false } };
}

export default async function UsersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <Users locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Users({ locale, searchParams }: { locale: Locale; searchParams: PageProps["searchParams"] }) {
  const dict = getDictionary(locale);
  const query = await searchParams;
  const list = await loadUsers({ q: first(query.q), page: first(query.page) });
  if ("denied" in list) {
    return <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription} />;
  }
  if ("failed" in list) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }
  const copy = dict.admin;
  return (
    <AdminSection title={copy.navUsers} description={copy.appointmentNote}>
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.upgradeNote}</p>
      <AdminFilters locale={locale} path="users" copy={copy} q={list.term} />
      {list.rows.length === 0 ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.empty}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-start dark:border-zinc-800">
                <th className="px-2 py-2 font-medium">{copy.columns.user}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.email}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.plan}</th>
                <th className="px-2 py-2 font-medium">{copy.status}</th>
                <th className="px-2 py-2 font-medium">{copy.columns.when}</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 align-top dark:border-zinc-900">
                  <td className="px-2 py-3">{row.full_name || copy.empty}</td>
                  <td className="px-2 py-3">{row.email || copy.empty}</td>
                  <td className="px-2 py-3">
                    {row.businesses.length === 0 ? copy.noBusiness : (
                      <ul className="flex flex-col gap-3">
                        {row.businesses.map((business) => (
                          <li key={business.id}>
                            <p className="font-medium">{business.name}</p>
                            <p className="text-zinc-600 dark:text-zinc-400">
                              {business.planName ?? copy.noPlan}
                              {business.status ? ` · ${dict.billing.statuses[business.status]}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-2 py-3">{row.appointed ? copy.appointed : copy.member}</td>
                  <td className="px-2 py-3">{adminWhen(row.created_at, locale, dict.billing.openEnded)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {list.rows.flatMap((row) => row.businesses.map((business) => {
          const choices = list.plans.filter((plan) => plan.id !== business.planId && (
            plan.currency !== business.planCurrency || (business.planAmount ?? 0) < plan.amountCents
          ));
          if (choices.length === 0) {
            return (
              <div key={business.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="font-medium">{row.full_name || row.email || copy.columns.user} · {business.name}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{copy.noUpgrade}</p>
              </div>
            );
          }
          return (
            <form key={business.id} action={grantPlanFormAction} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="font-medium">{row.full_name || row.email || copy.columns.user} · {business.name}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {copy.columns.plan}: {business.planName ?? copy.noPlan}
                  {business.status ? ` · ${dict.billing.statuses[business.status]}` : ""}
                </p>
              </div>
              <>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    {copy.upgradePlan}
                    <Select
                      name="planId"
                      required
                      options={choices.map((plan) => ({
                        value: plan.id,
                        label: `${plan.name} · ${formatAdminMoney(plan.amountCents, plan.currency, locale)}`,
                      }))}
                      className={`${adminFieldClassName} w-full`}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    {copy.reason}
                    <input name="reason" required minLength={8} maxLength={500} className={adminFieldClassName} />
                  </label>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <Checkbox name="confirm" value="yes" required />
                    {copy.confirm}
                  </label>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="q" value={list.term} />
                  <input type="hidden" name="page" value={String(list.page)} />
                  <button type="submit" className={statusActionClassName}>{copy.upgradePlan}</button>
              </>
            </form>
          );
        }))}
      </div>
      <AdminPager locale={locale} path="users" copy={copy} page={list.page} total={list.total} pageSize={list.pageSize} q={list.term} />
    </AdminSection>
  );
}
