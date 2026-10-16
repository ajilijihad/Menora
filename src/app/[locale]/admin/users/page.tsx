import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Info, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminNotice, adminWhen } from "@/components/admin/frame";
import { UserSelectRow } from "@/components/admin/user-select-row";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { formatAdminMoney } from "@/lib/admin/overview";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { grantPlanFormAction } from "@/modules/admin/actions";
import { loadUsers } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type UserRow = Extract<Awaited<ReturnType<typeof loadUsers>>, { rows: unknown[] }>["rows"][number];
type PlanChoice = Extract<Awaited<ReturnType<typeof loadUsers>>, { plans: unknown[] }>["plans"][number];
type BusinessChoice = UserRow["businesses"][number];

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15";

const primaryButtonClassName =
  "inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

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

function usersHref(pathname: string, input: { q?: string; page?: number; user?: string; business?: string }): string {
  const params = new URLSearchParams();
  if (input.q) {
    params.set("q", input.q);
  }
  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }
  if (input.user) {
    params.set("user", input.user);
  }
  if (input.business) {
    params.set("business", input.business);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function upgradeChoices(plans: PlanChoice[], business: BusinessChoice): PlanChoice[] {
  return plans.filter((plan) => plan.id !== business.planId && (
    plan.currency !== business.planCurrency || (business.planAmount ?? 0) < plan.amountCents
  ));
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
  const pathname = `/${locale}/admin/users`;
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const selected = list.rows.find((row) => row.id === first(query.user)) ?? null;
  const business = selected?.businesses.find((item) => item.id === first(query.business)) ?? selected?.businesses[0] ?? null;
  const choices = business ? upgradeChoices(list.plans, business) : [];
  const listHref = usersHref(pathname, { q: list.term, page: list.page });
  const previousHref = usersHref(pathname, { q: list.term, page: list.page - 1, user: selected?.id, business: business?.id });
  const nextHref = usersHref(pathname, { q: list.term, page: list.page + 1, user: selected?.id, business: business?.id });

  return (
    <main className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-5 px-4 py-6 lg:px-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{copy.navUsers}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{copy.appointmentNote}</p>
      </div>
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <p className="flex gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-muted shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
        <span>{copy.upgradeNote}</span>
      </p>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <form action={pathname} className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">{copy.search}</span>
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input name="q" defaultValue={list.term} placeholder={copy.search} className={`${fieldClassName} ps-10`} />
            </label>
            {selected ? <input type="hidden" name="user" value={selected.id} /> : null}
            <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto">{copy.apply}</button>
          </form>
          {list.rows.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted">{copy.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-sm">
                <thead>
                  <tr className="border-b border-line bg-brand/[0.04] text-start">
                    <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.user}</th>
                    <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.email}</th>
                    <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.plan}</th>
                    <th className="px-5 py-3.5 font-medium text-foreground">{copy.status}</th>
                    <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.when}</th>
                    <th className="w-12 px-3 py-3.5"><span className="sr-only">{copy.selectUser}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((row) => {
                    const name = row.full_name || copy.empty;
                    const current = selected?.id === row.id;
                    return (
                      <UserSelectRow
                        key={row.id}
                        href={`${usersHref(pathname, { q: list.term, page: list.page, user: row.id })}#user-details`}
                        selected={current}
                      >
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2.5 font-medium text-foreground">
                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                              <UserRound className="size-4" aria-hidden="true" />
                            </span>
                            {name}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted">{row.email || copy.empty}</td>
                        <td className="px-5 py-4">
                          {row.businesses.length === 0 ? <span className="text-muted">{copy.noBusiness}</span> : (
                            <ul className="flex flex-col gap-2">
                              {row.businesses.map((item) => (
                                <li key={item.id}>
                                  <p className="font-medium text-foreground">{item.name}</p>
                                  <p className="text-xs text-muted">{planSummary(item, copy, dict.billing.statuses)}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge appointed={row.appointed} label={row.appointed ? copy.appointed : copy.member} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-muted">{adminWhen(row.created_at, locale, dict.billing.openEnded)}</td>
                        <td className="px-3 py-4 text-muted">
                          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                        </td>
                      </UserSelectRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
            <p className="text-muted">{copy.page} {list.page} / {pages}</p>
            <div className="flex items-center gap-1.5">
              {list.page > 1 ? (
                <Link href={previousHref} aria-label={copy.previous} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              ) : (
                <span aria-disabled="true" className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted opacity-40">
                  <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
                </span>
              )}
              <span aria-current="page" className="inline-flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-medium text-white">{list.page}</span>
              {list.page < pages ? (
                <Link href={nextHref} aria-label={copy.next} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              ) : (
                <span aria-disabled="true" className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted opacity-40">
                  <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                </span>
              )}
            </div>
          </div>
        </section>

        <aside id="user-details" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:sticky lg:top-4">
          {selected ? (
            <UserDetails
              locale={locale}
              pathname={pathname}
              term={list.term}
              page={list.page}
              clearHref={listHref}
              user={selected}
              business={business}
              choices={choices}
              copy={copy}
              statuses={dict.billing.statuses}
              openEnded={dict.billing.openEnded}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <p className="max-w-xs text-sm leading-6 text-muted">{copy.selectUser}</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function planSummary(
  business: BusinessChoice,
  copy: { noPlan: string },
  statuses: { pending: string; active: string; past_due: string },
): string {
  const name = business.planName ?? copy.noPlan;
  return business.status ? `${name} · ${statuses[business.status]}` : name;
}

function RoleBadge({ appointed, label }: { appointed: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${appointed ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-sky-500/10 text-sky-700 dark:text-sky-300"}`}>
      <span className={`size-1.5 rounded-full ${appointed ? "bg-amber-500" : "bg-sky-500"}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function UserDetails({
  locale,
  pathname,
  term,
  page,
  clearHref,
  user,
  business,
  choices,
  copy,
  statuses,
  openEnded,
}: {
  locale: Locale;
  pathname: string;
  term: string;
  page: number;
  clearHref: string;
  user: UserRow;
  business: BusinessChoice | null;
  choices: PlanChoice[];
  copy: ReturnType<typeof getDictionary>["admin"];
  statuses: { pending: string; active: string; past_due: string };
  openEnded: string;
}) {
  const name = user.full_name || copy.empty;
  const email = user.email || copy.empty;
  const planLabel = business ? planSummary(business, copy, statuses) : copy.noPlan;

  return (
    <div>
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <UserRound className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{name}</p>
          <p className="truncate text-sm text-muted">{email}</p>
          <div className="mt-2">
            <RoleBadge appointed={user.appointed} label={user.appointed ? copy.appointed : copy.member} />
          </div>
        </div>
        <Link href={clearHref} aria-label={copy.subscriptionsPage.clear} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <X className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {business ? (
          <div className="rounded-xl bg-surface-muted px-4 py-3">
            <p className="text-xs font-medium text-muted">{copy.columns.plan}</p>
            <p className="mt-1 font-medium text-foreground">{business.name}</p>
            <p className="text-sm text-muted">{planLabel}</p>
          </div>
        ) : (
          <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">{copy.noBusiness}</p>
        )}

        {user.businesses.length > 1 ? (
          <form action={pathname} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="selected-business">{copy.columns.business}</label>
            {term ? <input type="hidden" name="q" value={term} /> : null}
            {page > 1 ? <input type="hidden" name="page" value={String(page)} /> : null}
            <input type="hidden" name="user" value={user.id} />
            <Select
              id="selected-business"
              name="business"
              defaultValue={business?.id}
              submitOnChange
              options={user.businesses.map((item) => ({ value: item.id, label: item.name }))}
              className={fieldClassName}
            />
          </form>
        ) : null}

        {business && choices.length === 0 ? <p className="text-sm text-muted">{copy.noUpgrade}</p> : null}

        {business && choices.length > 0 ? (
          <form key={`${user.id}:${business.id}`} action={grantPlanFormAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {copy.upgradePlan}
              <Select
                name="planId"
                required
                options={choices.map((plan) => ({
                  value: plan.id,
                  label: `${plan.name} · ${formatAdminMoney(plan.amountCents, plan.currency, locale)}`,
                }))}
                className={fieldClassName}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {copy.reason}
              <textarea name="reason" required minLength={8} maxLength={500} rows={4} placeholder={copy.reason} className={`${fieldClassName} h-auto min-h-24 resize-y py-3`} />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="confirm" value="yes" required />
              {copy.confirm}
            </label>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="businessId" value={business.id} />
            <input type="hidden" name="user" value={user.id} />
            <input type="hidden" name="q" value={term} />
            <input type="hidden" name="page" value={String(page)} />
            <button type="submit" className={primaryButtonClassName}>{copy.upgradePlan}</button>
          </form>
        ) : null}

        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
          <dt className="text-muted">{copy.columns.user}</dt>
          <dd className="text-end font-medium text-foreground">{name}</dd>
          <dt className="text-muted">{copy.columns.email}</dt>
          <dd className="truncate text-end text-foreground">{email}</dd>
          <dt className="text-muted">{copy.columns.plan}</dt>
          <dd className="text-end text-foreground">{business ? `${business.name} (${planLabel})` : copy.noPlan}</dd>
          <dt className="text-muted">{copy.status}</dt>
          <dd className="flex justify-end"><RoleBadge appointed={user.appointed} label={user.appointed ? copy.appointed : copy.member} /></dd>
          <dt className="text-muted">{copy.columns.when}</dt>
          <dd className="text-end text-foreground">{adminWhen(user.created_at, locale, openEnded)}</dd>
        </dl>
      </div>
    </div>
  );
}
