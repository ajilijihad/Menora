"use client";

import { Check, CheckCircle2, Clipboard, Clock, MoreHorizontal, Pencil, Users, XCircle } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { useActionState } from "react";

import { adminHref, adminPageSize } from "@/lib/admin/list";
import { adminWhen } from "@/components/admin/frame";
import { Notice } from "@/components/auth/notice";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import type { AdminCopy } from "@/lib/i18n/admin-copy";
import type { Locale } from "@/lib/i18n/locales";
import { adjustSubscriptionFormAction } from "@/modules/admin/actions";

const idleAdjustState = { status: "idle" as const, notice: null, revision: "0" };

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-foreground outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-surface-muted";
const primaryClassName =
  "inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClassName =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const statuses = ["pending", "active", "past_due", "expired", "canceled"] as const;
type SubscriptionStatus = (typeof statuses)[number];
const operations = ["activate", "renew", "expire", "cancel"] as const;
type Operation = (typeof operations)[number];
const pageSizes = [10, 20, 50] as const;
const recordPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminSubscriptionRow = {
  id: string;
  accountSubscriptionId: string;
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
  account: { name: string; email: string; businessCount: number };
  plan: { name: string; code: string } | null;
};

type Summary = {
  total: number | null;
  active: number | null;
  expiring: number | null;
  expired: number | null;
};

type SubscriptionsManagerProps = {
  locale: Locale;
  copy: AdminCopy;
  statusLabels: Record<SubscriptionStatus, string>;
  rows: AdminSubscriptionRow[];
  total: number;
  page: number;
  pageSize: number;
  term: string;
  status: "all" | SubscriptionStatus;
  summary: Summary;
};

export function SubscriptionsManager({
  locale,
  copy,
  statusLabels,
  rows,
  total,
  page,
  pageSize,
  term,
  status,
  summary,
}: SubscriptionsManagerProps) {
  const text = copy.subscriptionsPage;
  const pathname = `/${locale}/admin/subscriptions`;
  const [state, action, pending] = useActionState(adjustSubscriptionFormAction, idleAdjustState);
  const [pick, setPick] = useState<{ nonce: number; id: string; operation: Operation } | null>(null);
  const [copied, setCopied] = useState("");
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  function choose(row: AdminSubscriptionRow, nextOperation?: Operation) {
    setPick((current) => ({
      nonce: (current?.nonce ?? 0) + 1,
      id: row.accountSubscriptionId,
      operation: nextOperation ?? current?.operation ?? "activate",
    }));
    document.getElementById("subscription-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function copyRecord(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? "" : current)), 2000);
    } catch {
      setCopied("");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{copy.navSubscriptions}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{text.description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Users className="size-5" />} tone="bg-orange-100 text-brand dark:bg-orange-950/50" label={text.total} value={summary.total} hint={text.totalHint} empty={text.unavailable} />
        <Metric icon={<CheckCircle2 className="size-5" />} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" label={text.active} value={summary.active} hint={text.activeHint} empty={text.unavailable} />
        <Metric icon={<Clock className="size-5" />} tone="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300" label={text.expiring} value={summary.expiring} hint={text.expiringHint} empty={text.unavailable} />
        <Metric icon={<XCircle className="size-5" />} tone="bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300" label={text.expired} value={summary.expired} hint={text.expiredHint} empty={text.unavailable} />
      </div>

      <section className="rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <form action={pathname} className="flex flex-col gap-3 border-b border-line p-3 lg:flex-row lg:items-center">
          {pageSize !== adminPageSize ? <input type="hidden" name="size" value={pageSize} /> : null}
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">{copy.search}</span>
            <input name="q" defaultValue={term} placeholder={text.searchPlaceholder} className={fieldClassName} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted">{copy.status}</span>
            <Select
              name="status"
              defaultValue={status}
              options={[{ value: "all", label: copy.all }, ...statuses.map((value) => ({ value, label: statusLabels[value] }))]}
              className={`${fieldClassName} w-40`}
            />
          </label>
          <button type="submit" className={primaryClassName}>{copy.apply}</button>
        </form>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">{copy.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-medium text-muted">
                  <th className="px-4 py-3 text-start font-medium">{text.recordId}</th>
                  <th className="px-3 py-3 text-start font-medium">{text.account}</th>
                  <th className="px-3 py-3 text-start font-medium">{text.plan}</th>
                  <th className="px-3 py-3 text-start font-medium">{copy.status}</th>
                  <th className="px-3 py-3 text-start font-medium">{text.expiration}</th>
                  <th className="px-3 py-3 text-start font-medium">{text.createdAt}</th>
                  <th className="px-4 py-3 text-end font-medium">{text.actions}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono text-xs text-foreground">{row.id.slice(0, 8)}…{row.id.slice(-4)}</span>
                        <button type="button" onClick={() => copyRecord(row.id)} aria-label={text.copyId} className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                          {copied === row.id ? <Check className="size-3.5 text-emerald-600" aria-hidden="true" /> : <Clipboard className="size-3.5" aria-hidden="true" />}
                        </button>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2">
                        <AccountMark name={row.account.name} />
                        <span className="min-w-0">
                          <span className="block font-semibold text-foreground">{row.account.name}</span>
                          <span className="block text-xs text-muted">{row.account.email || text.businessCount.replace("{count}", String(row.account.businessCount))}</span>
                          {row.account.email ? <span className="block text-xs text-muted">{text.businessCount.replace("{count}", String(row.account.businessCount))}</span> : null}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3"><PlanBadge name={row.plan?.name ?? copy.empty} code={row.plan?.code ?? ""} /></td>
                    <td className="px-3 py-3"><StatusBadge status={row.status} label={statusLabels[row.status]} /></td>
                    <td className="whitespace-nowrap px-3 py-3">{adminWhen(row.current_period_end, locale, text.noExpiration)}</td>
                    <td className="whitespace-nowrap px-3 py-3">{adminWhen(row.created_at, locale, copy.empty)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => choose(row)} className={secondaryClassName}>
                          <Pencil className="size-3.5" aria-hidden="true" />
                          {text.manage}
                        </button>
                        <details className="relative">
                          <summary aria-label={text.actions} className="inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-lg border border-line hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </summary>
                          <div className="absolute end-0 z-20 mt-1 w-48 rounded-xl border border-line bg-surface p-1 text-sm shadow-[var(--shadow-card)]">
                            {operations.map((value) => (
                              <button key={value} type="button" onClick={(event) => { choose(row, value); event.currentTarget.closest("details")?.removeAttribute("open"); }} className="block w-full rounded-lg px-3 py-2 text-start hover:bg-surface-muted">
                                {copy[value]}
                              </button>
                            ))}
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{text.showing.replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(total))}</p>
          <div className="flex items-center gap-2">
            {page > 1 ? <Link href={adminHref(pathname, { q: term, status, page: page - 1, size: pageSize })} className="inline-flex size-9 items-center justify-center rounded-lg border border-line hover:bg-surface-muted" aria-label={copy.previous}>‹</Link> : <span className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted/40">‹</span>}
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-brand px-2 font-semibold text-white">{page}</span>
            <span className="text-xs">/ {pages}</span>
            {page < pages ? <Link href={adminHref(pathname, { q: term, status, page: page + 1, size: pageSize })} className="inline-flex size-9 items-center justify-center rounded-lg border border-line hover:bg-surface-muted" aria-label={copy.next}>›</Link> : <span className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted/40">›</span>}
            <form action={pathname}>
              {term ? <input type="hidden" name="q" value={term} /> : null}
              {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
              <label className="sr-only" htmlFor="subscription-page-size">{text.perPage.replace("{count}", String(pageSize))}</label>
              <Select
                id="subscription-page-size"
                name="size"
                defaultValue={String(pageSize)}
                submitOnChange
                options={pageSizes.map((size) => ({ value: String(size), label: text.perPage.replace("{count}", String(size)) }))}
                className={`${fieldClassName} h-9 w-28`}
              />
            </form>
          </div>
        </div>
      </section>

      <section id="subscription-form" className="scroll-mt-24 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Pencil className="size-5" aria-hidden="true" />
          </span>
          <span>
            <h2 className="text-lg font-semibold">{text.updateTitle}</h2>
            <p className="mt-0.5 text-sm text-muted">{text.updateHint}</p>
          </span>
        </div>
        {state.notice ? <div className="mb-4"><Notice tone={state.status === "success" ? "success" : "error"}>{copy.messages[state.notice]}</Notice></div> : null}
        <AdjustFields
          locale={locale}
          copy={copy}
          text={text}
          rows={rows}
          statusLabels={statusLabels}
          action={action}
          pending={pending}
          pick={pick}
          resetRevision={state.status === "success" ? state.revision : ""}
          copied={copied}
          onCopy={copyRecord}
        />
      </section>
    </div>
  );
}

function AdjustFields({
  locale,
  copy,
  text,
  rows,
  statusLabels,
  action,
  pending,
  pick,
  resetRevision,
  copied,
  onCopy,
}: {
  locale: Locale;
  copy: AdminCopy;
  text: AdminCopy["subscriptionsPage"];
  rows: AdminSubscriptionRow[];
  statusLabels: Record<SubscriptionStatus, string>;
  action: (formData: FormData) => void;
  pending: boolean;
  pick: { nonce: number; id: string; operation: Operation } | null;
  resetRevision: string;
  copied: string;
  onCopy: (id: string) => void;
}) {
  const [applied, setApplied] = useState(pick?.nonce ?? 0);
  const [seenReset, setSeenReset] = useState(resetRevision);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [operation, setOperation] = useState<Operation>("activate");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  if (resetRevision && seenReset !== resetRevision) {
    setSeenReset(resetRevision);
    setApplied(pick?.nonce ?? 0);
    setSubscriptionId("");
    setOperation("activate");
    setReason("");
    setConfirmed(false);
  } else if (pick && pick.nonce !== applied) {
    setApplied(pick.nonce);
    setSubscriptionId(pick.id);
    setOperation(pick.operation);
  }
  const selected = rows.find((row) => row.id === subscriptionId.trim()) ?? null;
  const valid = recordPattern.test(subscriptionId.trim()) && reason.trim().length >= 8 && reason.length <= 500 && confirmed;

  function clearForm() {
    setSubscriptionId("");
    setOperation("activate");
    setReason("");
    setConfirmed(false);
  }

  return (
    <>
      <form id="subscription-adjust" action={action} className="grid gap-4 lg:grid-cols-2">
        <input type="hidden" name="locale" value={locale} />
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm" htmlFor="subscription-id">
            <span className="font-medium">{text.recordId}</span>
            <span className="relative block">
              <input id="subscription-id" name="subscriptionId" required value={subscriptionId} onChange={(event) => setSubscriptionId(event.target.value)} placeholder={text.idPlaceholder} className={`${fieldClassName} pe-11 font-mono text-xs`} />
              <button type="button" onClick={() => subscriptionId && onCopy(subscriptionId.trim())} aria-label={text.copyId} className="absolute end-2 top-2 inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                {copied === subscriptionId.trim() ? <Check className="size-3.5 text-emerald-600" aria-hidden="true" /> : <Clipboard className="size-3.5" aria-hidden="true" />}
              </button>
            </span>
            {selected ? (
              <span className="text-xs text-muted">{text.selected.replace("{account}", selected.account.name).replace("{plan}", selected.plan?.name ?? copy.empty).replace("{status}", statusLabels[selected.status])}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1.5 text-sm" htmlFor="subscription-operation">
            <span className="font-medium">{copy.operation}</span>
            <Select
              id="subscription-operation"
              name="operation"
              value={operation}
              onValueChange={(next) => setOperation(next as Operation)}
              options={operations.map((value) => ({ value, label: copy[value] }))}
              className={fieldClassName}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="confirm" value="yes" checked={confirmed} onCheckedChange={setConfirmed} />
            {copy.confirm}
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!valid || pending} onClick={() => dialogRef.current?.showModal()} className={primaryClassName}>{copy.applyChange}</button>
            <button type="button" onClick={clearForm} className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-medium hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{text.clear}</button>
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-sm" htmlFor="subscription-reason">
          <span className="font-medium">{copy.reason} <span className="text-brand">*</span></span>
          <textarea id="subscription-reason" name="reason" required minLength={8} maxLength={500} rows={7} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={text.reasonPlaceholder} className="min-h-40 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" />
          <span className="flex justify-between gap-3 text-xs text-muted">
            <span>{text.reasonHint}</span>
            <span>{reason.length}/500</span>
          </span>
        </label>
      </form>
      <dialog ref={dialogRef} className="w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-line bg-surface p-5 text-foreground shadow-[var(--shadow-card)] backdrop:bg-slate-950/40">
        <h2 className="text-lg font-semibold">{text.confirmTitle}</h2>
        <p className="mt-1 text-sm text-muted">{text.confirmBody}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => dialogRef.current?.close()} className="inline-flex h-11 items-center rounded-xl border border-line px-4 text-sm font-medium">{text.clear}</button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              dialogRef.current?.close();
              const form = document.getElementById("subscription-adjust");
              if (form instanceof HTMLFormElement) {
                form.requestSubmit();
              }
            }}
            className={primaryClassName}
          >
            {copy.applyChange}
          </button>
        </div>
      </dialog>
    </>
  );
}

function Metric({ icon, tone, label, value, hint, empty }: { icon: ReactNode; tone: string; label: string; value: number | null; hint: string; empty: string }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${tone}`}>{icon}</span>
        <span>
          <span className="block text-sm text-muted">{label}</span>
          <span className="mt-0.5 block text-2xl font-semibold tabular-nums">{value === null ? empty : value}</span>
        </span>
      </div>
      <p className="mt-3 text-xs text-muted">{hint}</p>
    </article>
  );
}

function AccountMark({ name }: { name: string }) {
  return (
    <span className="inline-flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
      {(name.trim().charAt(0) || "?").toUpperCase()}
    </span>
  );
}

function PlanBadge({ name, code }: { name: string; code: string }) {
  const tone = code === "pro"
    ? "bg-orange-100 text-brand dark:bg-orange-950/40"
    : code === "starter"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : code === "free"
        ? "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
        : "bg-surface-muted text-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{name}</span>;
}

function StatusBadge({ status, label }: { status: SubscriptionStatus; label: string }) {
  const tone = status === "active"
    ? "text-emerald-600 dark:text-emerald-300"
    : status === "expired"
      ? "text-rose-600 dark:text-rose-300"
      : status === "past_due" || status === "pending"
        ? "text-amber-600 dark:text-amber-300"
        : "text-muted";
  const dot = status === "active"
    ? "bg-emerald-500"
    : status === "expired"
      ? "bg-rose-500"
      : status === "past_due" || status === "pending"
        ? "bg-amber-500"
        : "bg-zinc-400";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
