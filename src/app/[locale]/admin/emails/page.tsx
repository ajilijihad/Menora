import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Mail, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CopyValue } from "@/components/admin/copy-value";
import { AdminNotice, adminWhen } from "@/components/admin/frame";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { adminHref, adminPageSize } from "@/lib/admin/list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { loadEmailLogs } from "@/modules/admin/queries";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const pageSizes = [10, 20, 50] as const;

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15";

const primaryButtonClassName =
  "inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

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

function statusTone(status: string): string {
  if (status === "sent") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "queued") {
    return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
  }
  return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
}

function statusDot(status: string): string {
  if (status === "sent") {
    return "bg-emerald-500";
  }
  if (status === "queued") {
    return "bg-amber-500";
  }
  return "bg-rose-500";
}

async function EmailLogs({ locale, searchParams }: { locale: Locale; searchParams: PageProps["searchParams"] }) {
  const dict = getDictionary(locale);
  const query = await searchParams;
  const list = await loadEmailLogs({ q: first(query.q), status: first(query.status), page: first(query.page), size: first(query.size) });
  if ("denied" in list) {
    return <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription} />;
  }
  if ("failed" in list) {
    return <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />;
  }
  const copy = dict.admin;
  const pathname = `/${locale}/admin/emails`;
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const from = list.total === 0 ? 0 : (list.page - 1) * list.pageSize + 1;
  const to = Math.min(list.page * list.pageSize, list.total);
  const statuses = [
    { value: "queued", label: copy.queued },
    { value: "sent", label: copy.sent },
    { value: "failed", label: copy.failed },
  ];
  const previousHref = adminHref(pathname, { q: list.term, status: list.status, page: list.page - 1, size: list.pageSize });
  const nextHref = adminHref(pathname, { q: list.term, status: list.status, page: list.page + 1, size: list.pageSize });

  return (
    <main className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-5 px-4 py-6 lg:px-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{copy.navEmails}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{copy.emailsDescription}</p>
      </div>
      <AdminNotice copy={copy} notice={first(query.notice)} />
      <form action={pathname} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-end">
        {list.pageSize !== adminPageSize ? <input type="hidden" name="size" value={list.pageSize} /> : null}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{copy.search}</span>
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input name="q" defaultValue={list.term} placeholder={copy.emailsSearch} className={`${fieldClassName} ps-10`} />
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
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.email}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.template}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.status}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.provider}</th>
                  <th className="px-5 py-3.5 font-medium text-foreground">{copy.columns.when}</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => {
                  const provider = row.provider_message_id || row.error_message || "";
                  const statusLabel = row.status === "queued" ? copy.queued : row.status === "sent" ? copy.sent : copy.failed;
                  return (
                    <tr key={row.id} className="border-b border-line transition-colors last:border-b-0 hover:bg-surface-muted/60">
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2.5 text-foreground">
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted">
                            <Mail className="size-4" aria-hidden="true" />
                          </span>
                          <span className="break-all">{row.to_email}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-foreground">{row.template}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(row.status)}`}>
                          <span className={`size-1.5 rounded-full ${statusDot(row.status)}`} aria-hidden="true" />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {provider ? (
                          <span className="inline-flex max-w-xs items-center gap-1">
                            <span title={provider} className="truncate font-mono text-xs text-muted">{provider}</span>
                            <CopyValue value={provider} label={copy.copyMessage} copiedLabel={copy.subscriptionsPage.copied} />
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted">{adminWhen(row.created_at, locale, dict.billing.openEnded)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-line px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">{copy.subscriptionsPage.showing.replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(list.total))}</p>
          <div className="flex flex-wrap items-center gap-2">
            <form action={pathname} className="flex items-center">
              {list.term ? <input type="hidden" name="q" value={list.term} /> : null}
              {list.status !== "all" ? <input type="hidden" name="status" value={list.status} /> : null}
              <label className="sr-only" htmlFor="email-page-size">{copy.subscriptionsPage.perPage.replace("{count}", String(list.pageSize))}</label>
              <Select
                id="email-page-size"
                name="size"
                defaultValue={String(list.pageSize)}
                submitOnChange
                options={pageSizes.map((size) => ({ value: String(size), label: copy.subscriptionsPage.perPage.replace("{count}", String(size)) }))}
                className="h-9 w-32 rounded-lg border border-line bg-surface px-3 text-sm text-foreground"
              />
            </form>
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
    </main>
  );
}
