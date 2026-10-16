import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Search, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminNotice } from "@/components/admin/frame";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { adminHref } from "@/lib/admin/list";
import { businessMediaUrl } from "@/lib/businesses/media-url";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { suspendBusinessFormAction } from "@/modules/admin/actions";
import { loadBusinesses } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15";

const primaryButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60";

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

function statusTone(status: "draft" | "active" | "archived" | "suspended"): string {
  if (status === "active") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "draft") {
    return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
  }
  if (status === "suspended") {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }
  return "bg-surface-muted text-muted";
}

function statusDot(status: "draft" | "active" | "archived" | "suspended"): string {
  if (status === "active") {
    return "bg-emerald-500";
  }
  if (status === "draft") {
    return "bg-amber-500";
  }
  if (status === "suspended") {
    return "bg-rose-500";
  }
  return "bg-muted";
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
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const pathname = `/${locale}/admin/businesses`;
  const previousHref = adminHref(pathname, { q: list.term, status: list.status, page: list.page - 1 });
  const nextHref = adminHref(pathname, { q: list.term, status: list.status, page: list.page + 1 });

  return (
    <main className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-5 px-4 py-6 lg:px-6 lg:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{copy.navBusinesses}</h1>
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <form action={pathname} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-end">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{copy.search}</span>
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input name="q" defaultValue={list.term} placeholder={copy.search} className={`${fieldClassName} ps-10`} />
        </label>
        <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-foreground sm:w-44">
          {copy.status}
          <Select
            name="status"
            defaultValue={list.status ?? "all"}
            options={[{ value: "all", label: copy.all }, ...statuses]}
            className={fieldClassName}
          />
        </label>
        <button type="submit" className={`${primaryButtonClassName} w-full sm:w-auto`}>{copy.apply}</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {list.rows.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">{copy.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-brand/[0.04] text-start">
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.business}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.recordId}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.owner}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.status}</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => {
                  const status = row.suspended_at ? "suspended" : row.status;
                  const owner = row.owner?.full_name || row.owner?.email || copy.empty;
                  const logoUrl = businessMediaUrl(row.logo_path);
                  return (
                    <tr key={row.id} className="border-b border-line last:border-b-0 transition-colors hover:bg-surface-muted/60">
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-3">
                          {logoUrl ? <img src={logoUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" /> : null}
                          <span className="min-w-0">
                            <p className="font-medium text-foreground">{row.name}</p>
                            <p className="mt-0.5 text-xs text-muted">{row.slug}</p>
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-muted">{row.id}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2.5 text-foreground">
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted">
                            <UserRound className="size-4" aria-hidden="true" />
                          </span>
                          {owner}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(status)}`}>
                          <span className={`size-1.5 rounded-full ${statusDot(status)}`} aria-hidden="true" />
                          {copy.businessStatuses[status]}
                        </span>
                      </td>
                    </tr>
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

      <form action={suspendBusinessFormAction} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3 border-b border-brand/10 bg-brand/[0.04] px-5 py-4">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Settings className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-foreground">{copy.operation}</h2>
        </div>
        <div className="grid gap-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {copy.recordId}
              <input name="businessId" required placeholder={copy.recordId} className={fieldClassName} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {copy.operation}
              <Select
                name="mode"
                options={[{ value: "suspend", label: copy.suspend }, { value: "reactivate", label: copy.reactivate }]}
                className={fieldClassName}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {copy.reason}
            <textarea name="reason" required minLength={8} maxLength={500} rows={3} placeholder={copy.reason} className={`${fieldClassName} h-auto min-h-24 resize-y py-3`} />
          </label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="confirm" value="yes" required />
              {copy.confirm}
            </label>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className={`${primaryButtonClassName} w-full sm:w-auto`}>{copy.applyChange}</button>
          </div>
        </div>
      </form>
    </main>
  );
}
