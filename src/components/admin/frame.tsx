import Link from "next/link";
import type { ReactNode } from "react";

import { Notice } from "@/components/auth/notice";
import { statusActionClassName } from "@/components/states/status-panel";
import { adminHref } from "@/lib/admin/list";
import type { AdminCopy } from "@/lib/i18n/admin-copy";
import type { Locale } from "@/lib/i18n/locales";

export const adminFieldClassName =
  "h-10 rounded-lg border border-zinc-300 bg-transparent px-3 text-sm dark:border-zinc-700";

export function AdminSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">{description}</p> : null}
      </div>
      {children}
    </main>
  );
}

export function AdminNotice({ copy, notice }: { copy: AdminCopy; notice: string | undefined }) {
  if (!notice || !(notice in copy.messages)) {
    return null;
  }
  const key = notice as keyof AdminCopy["messages"];
  const tone = notice === "saved" || notice === "created" || notice === "suspended" || notice === "reactivated" || notice === "adjusted" || notice === "refunded" || notice === "granted"
    ? "success"
    : "error";
  return <Notice tone={tone}>{copy.messages[key]}</Notice>;
}

export function AdminFilters({
  locale,
  path,
  copy,
  q,
  status,
  statuses,
}: {
  locale: Locale;
  path: string;
  copy: AdminCopy;
  q: string;
  status?: string;
  statuses?: Array<{ value: string; label: string }>;
}) {
  return (
    <form action={`/${locale}/admin/${path}`} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-2 text-sm font-medium">
        {copy.search}
        <input name="q" defaultValue={q} className={adminFieldClassName} />
      </label>
      {statuses ? (
        <label className="flex flex-col gap-2 text-sm font-medium">
          {copy.status}
          <select name="status" defaultValue={status ?? "all"} className={adminFieldClassName}>
            <option value="all">{copy.all}</option>
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      <button type="submit" className={statusActionClassName}>{copy.apply}</button>
    </form>
  );
}

export function AdminPager({
  locale,
  path,
  copy,
  page,
  total,
  pageSize,
  q,
  status,
  currency,
}: {
  locale: Locale;
  path: string;
  copy: AdminCopy;
  page: number;
  total: number;
  pageSize: number;
  q: string;
  status?: string;
  currency?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pathname = `/${locale}/admin/${path}`;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p>{copy.page} {page} / {pages}</p>
      <div className="flex gap-4">
        {page > 1 ? (
          <Link href={adminHref(pathname, { q, status, page: page - 1, currency })}>{copy.previous}</Link>
        ) : null}
        {page < pages ? (
          <Link href={adminHref(pathname, { q, status, page: page + 1, currency })}>{copy.next}</Link>
        ) : null}
      </div>
    </div>
  );
}

export function adminWhen(value: string | null, locale: Locale, empty: string): string {
  if (!value) {
    return empty;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return empty;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
}
