"use client";

import { BarChart3, Crown, Database, Layers, Leaf, MoreHorizontal, Pencil, Plane, Plus, Search, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AdminPager } from "@/components/admin/frame";
import { adminHref } from "@/lib/admin/list";
import type { AdminCopy } from "@/lib/i18n/admin-copy";
import { formatMoney } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";
import { currencies } from "@/lib/menus/money";
import { savePlanFormAction } from "@/modules/admin/actions";

const descriptionLimit = 2000;
const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-foreground outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted";
const primaryClassName =
  "inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const secondaryClassName =
  "inline-flex h-11 items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-medium text-foreground transition hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export type AdminPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  is_active: boolean;
  max_businesses: number;
  max_products: number;
  max_themes: number;
  analytics_retention_days: number;
  custom_domains: boolean;
};

type PlanFilters = {
  q: string;
  status: "all" | "active" | "draft";
  currency: string;
  page: number;
};

type PlanSummary = {
  activePlans: number | null;
  subscribers: number | null;
  revenue: Array<{ currency: string; amountCents: number }> | null;
  currencies: string[];
};

type PlansManagerProps = {
  locale: Locale;
  copy: AdminCopy;
  plans: AdminPlan[];
  total: number;
  pageSize: number;
  counts: { all: number; active: number; draft: number };
  filters: PlanFilters;
  summary: PlanSummary;
};

export function PlansManager({ locale, copy, plans, total, pageSize, counts, filters, summary }: PlansManagerProps) {
  const page = copy.plansPage;
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [reset, setReset] = useState(0);
  const [change, setChange] = useState<{ plan: AdminPlan; active: boolean } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = `/${locale}/admin/plans`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (change && !dialog.open) {
      dialog.showModal();
    }
    if (!change && dialog.open) {
      dialog.close();
    }
  }, [change]);

  function focusForm(plan: AdminPlan | null) {
    setEditing(plan);
    if (!plan) {
      setReset((value) => value + 1);
    }
    document.getElementById("plan-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{copy.navPlans}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{page.description}</p>
        </div>
        <button type="button" onClick={() => focusForm(null)} className={primaryClassName}>
          <Plus className="me-2 size-4" aria-hidden="true" />
          {copy.create}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard icon={<Database className="size-5" />} tone="bg-orange-100 text-brand dark:bg-orange-950/50" label={page.activePlans} value={summary.activePlans === null ? page.unavailable : String(summary.activePlans)} hint={page.activePlansHint} />
        <SummaryCard icon={<Users className="size-5" />} tone="bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300" label={page.subscribers} value={summary.subscribers === null ? page.unavailable : String(summary.subscribers)} hint={page.subscribersHint} />
        <SummaryCard icon={<BarChart3 className="size-5" />} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" label={page.mrr} value={<RevenueValue locale={locale} revenue={summary.revenue} empty={page.unavailable} />} hint={summary.revenue === null ? page.mrrUnavailable : summary.revenue.length === 0 ? page.mrrNone : page.mrrHint} />
      </div>

      <section className="rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b border-line p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={page.columnStatus}>
            <FilterTab href={adminHref(pathname, { q: filters.q, currency: filters.currency })} selected={filters.status === "all"} label={`${page.allPlans} (${counts.all})`} />
            <FilterTab href={adminHref(pathname, { q: filters.q, status: "active", currency: filters.currency })} selected={filters.status === "active"} label={`${page.active} (${counts.active})`} />
            <FilterTab href={adminHref(pathname, { q: filters.q, status: "draft", currency: filters.currency })} selected={filters.status === "draft"} label={`${page.draft} (${counts.draft})`} />
          </div>
          <form key={`${filters.q}:${filters.status}:${filters.currency}`} action={pathname} className="flex flex-col gap-2 sm:flex-row">
            {filters.status !== "all" ? <input type="hidden" name="status" value={filters.status} /> : null}
            <label className="relative block min-w-0 sm:w-64">
              <span className="sr-only">{copy.search}</span>
              <Search className="pointer-events-none absolute start-3 top-3 size-4 text-muted" aria-hidden="true" />
              <input name="q" defaultValue={filters.q} placeholder={page.searchPlaceholder} className={`${fieldClassName} ps-9`} />
            </label>
            <label className="block sm:w-44">
              <span className="sr-only">{page.currency}</span>
              <select name="currency" defaultValue={filters.currency} onChange={(event) => event.currentTarget.form?.requestSubmit()} className={fieldClassName}>
                <option value="">{page.allCurrencies}</option>
                {summary.currencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </label>
          </form>
        </div>
        {plans.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">{page.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs font-medium text-muted">
                  <th className="px-4 py-3 text-start font-medium">{page.columnPlan}</th>
                  <th className="px-3 py-3 text-start font-medium">{page.columnPrice}</th>
                  <th className="px-3 py-3 text-start font-medium">{page.columnBusinesses}</th>
                  <th className="px-3 py-3 text-start font-medium">{page.columnProducts}</th>
                  <th className="px-3 py-3 text-start font-medium">{page.columnLayouts}</th>
                  <th className="px-3 py-3 text-start font-medium">{page.columnAnalytics}</th>
                  <th className="px-3 py-3 text-start font-medium">{page.columnDomains}</th>
                  <th className="px-3 py-3 text-start font-medium">{page.columnStatus}</th>
                  <th className="px-4 py-3 text-end font-medium">{page.columnActions}</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PlanMark code={plan.code} />
                        <span className="min-w-0">
                          <span className="block font-semibold text-foreground">{plan.name}</span>
                          {plan.description ? <span className="mt-0.5 block max-w-xs truncate text-xs text-muted">{plan.description}</span> : null}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-foreground">
                      {formatMoney(plan.amount_cents, plan.currency, locale) || `${plan.amount_cents} ${plan.currency}`}
                      <span className="ms-1 font-normal text-muted">{page.perMonth}</span>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{plan.max_businesses}</td>
                    <td className="px-3 py-3 tabular-nums">{plan.max_products}</td>
                    <td className="px-3 py-3 tabular-nums">{plan.max_themes}</td>
                    <td className="whitespace-nowrap px-3 py-3">{page.days.replace("{count}", String(plan.analytics_retention_days))}</td>
                    <td className="px-3 py-3">{plan.custom_domains ? page.included : page.notIncluded}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${plan.is_active ? "text-emerald-600 dark:text-emerald-300" : "text-muted"}`}>
                        <span className={`size-1.5 rounded-full ${plan.is_active ? "bg-emerald-500" : "bg-zinc-400"}`} aria-hidden="true" />
                        {plan.is_active ? page.active : page.draft}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => focusForm(plan)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                          <Pencil className="size-3.5" aria-hidden="true" />
                          {page.edit}
                        </button>
                        <details className="relative">
                          <summary aria-label={page.more} className="inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-lg border border-line hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </summary>
                          <div className="absolute end-0 z-20 mt-1 w-44 rounded-xl border border-line bg-surface p-1 text-sm shadow-[var(--shadow-card)]">
                            <button
                              type="button"
                              onClick={(event) => {
                                setChange({ plan, active: !plan.is_active });
                                event.currentTarget.closest("details")?.removeAttribute("open");
                              }}
                              className="block w-full rounded-lg px-3 py-2 text-start hover:bg-surface-muted"
                            >
                              {plan.is_active ? page.deactivate : page.activate}
                            </button>
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
        <div className="border-t border-line px-4 py-3">
          <AdminPager locale={locale} path="plans" copy={copy} page={filters.page} total={total} pageSize={pageSize} q={filters.q} status={filters.status} currency={filters.currency} />
        </div>
      </section>

      <PlanEditor key={`${editing?.id ?? "new"}:${reset}`} locale={locale} copy={page} createLabel={copy.create} plan={editing} filters={filters} onCancel={() => focusForm(null)} />

      <dialog
        ref={dialogRef}
        className="w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-line bg-surface p-5 text-foreground shadow-[var(--shadow-card)] backdrop:bg-slate-950/40"
        onClose={() => setChange(null)}
      >
        {change ? (
          <form action={savePlanFormAction} className="flex flex-col gap-4">
            <HiddenPlan plan={change.plan} active={change.active} locale={locale} filters={filters} />
            <div>
              <h2 className="text-lg font-semibold">{page.confirmTitle}</h2>
              <p className="mt-1 text-sm text-muted">{page.confirmBody}</p>
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{page.reason} <span className="text-brand">*</span></span>
              <textarea name="reason" required minLength={8} maxLength={500} rows={3} autoFocus placeholder={page.reasonPlaceholder} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" />
              <span className="text-xs text-muted">{page.reasonHint}</span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setChange(null)} className={secondaryClassName}>{page.cancel}</button>
              <button type="submit" className={primaryClassName}>{page.confirm}</button>
            </div>
          </form>
        ) : null}
      </dialog>
    </div>
  );
}

function PlanEditor({
  locale,
  copy,
  createLabel,
  plan,
  filters,
  onCancel,
}: {
  locale: Locale;
  copy: AdminCopy["plansPage"];
  createLabel: string;
  plan: AdminPlan | null;
  filters: PlanFilters;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(String(plan?.amount_cents ?? 0));
  const [currency, setCurrency] = useState(plan?.currency ?? "USD");
  const [descriptionCount, setDescriptionCount] = useState(plan?.description?.length ?? 0);
  const [reasonCount, setReasonCount] = useState(0);
  const preview = formatMoney(Number(amount), currency, locale);

  return (
    <form id="plan-form" action={savePlanFormAction} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="planId" value={plan?.id ?? ""} />
      <FilterFields filters={filters} />
      <div className="mb-5 flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Plus className="size-5" aria-hidden="true" />
        </span>
        <span>
          <h2 className="text-lg font-semibold text-foreground">{plan ? copy.editTitle : copy.createTitle}</h2>
          <p className="mt-0.5 text-sm text-muted">{plan ? copy.editHint : copy.createHint}</p>
        </span>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-3">
        <fieldset className="rounded-2xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">{copy.basic}</legend>
          <div className="mt-3 flex flex-col gap-3">
            <Field label={copy.code} htmlFor="plan-code" required>
              {plan ? (
                <>
                  <input id="plan-code" value={plan.code} disabled className={fieldClassName} />
                  <input type="hidden" name="code" value={plan.code} />
                </>
              ) : (
                <input id="plan-code" name="code" required pattern="[a-z0-9_]+" maxLength={40} placeholder={copy.codePlaceholder} className={fieldClassName} />
              )}
            </Field>
            <Field label={copy.name} htmlFor="plan-name" required>
              <input id="plan-name" name="name" required maxLength={120} defaultValue={plan?.name ?? ""} placeholder={copy.namePlaceholder} className={fieldClassName} />
            </Field>
            <Field label={copy.planDescription} htmlFor="plan-description">
              <textarea
                id="plan-description"
                name="description"
                rows={4}
                maxLength={descriptionLimit}
                defaultValue={plan?.description ?? ""}
                placeholder={copy.planDescriptionPlaceholder}
                onChange={(event) => setDescriptionCount(event.target.value.length)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              />
              <span className="text-end text-xs text-muted">{descriptionCount}/{descriptionLimit}</span>
            </Field>
          </div>
        </fieldset>
        <fieldset className="rounded-2xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">{copy.pricing}</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label={copy.price} htmlFor="plan-price" required>
              <input id="plan-price" name="amountCents" required type="number" min={0} max={2000000000} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} className={fieldClassName} />
              {preview ? <span className="text-xs text-muted">{preview} {copy.perMonth}</span> : null}
            </Field>
            <Field label={copy.currency} htmlFor="plan-currency" required>
              <select id="plan-currency" name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className={fieldClassName}>
                {currencies.map((item) => (
                  <option key={item.code} value={item.code}>{item.code}</option>
                ))}
              </select>
            </Field>
            <Field label={copy.interval} htmlFor="plan-interval">
              <select id="plan-interval" disabled defaultValue="month" className={fieldClassName}>
                <option value="month">{copy.monthly}</option>
              </select>
              <span className="text-xs text-muted">{copy.intervalNote}</span>
            </Field>
            <Field label={copy.businessLimit} htmlFor="plan-businesses" required>
              <input id="plan-businesses" name="maxBusinesses" required type="number" min={1} max={100000} step={1} defaultValue={plan?.max_businesses ?? 1} className={fieldClassName} />
            </Field>
            <Field label={copy.productLimit} htmlFor="plan-products" required>
              <input id="plan-products" name="maxProducts" required type="number" min={1} max={100000} step={1} defaultValue={plan?.max_products ?? 25} className={fieldClassName} />
            </Field>
            <Field label={copy.layoutLimit} htmlFor="plan-layouts" required>
              <input id="plan-layouts" name="maxThemes" required type="number" min={1} max={5} step={1} defaultValue={plan?.max_themes ?? 1} className={fieldClassName} />
            </Field>
            <Field label={copy.retention} htmlFor="plan-retention" required>
              <input id="plan-retention" name="analyticsRetentionDays" required type="number" min={1} max={3650} step={1} defaultValue={plan?.analytics_retention_days ?? 7} className={fieldClassName} />
            </Field>
          </div>
        </fieldset>
        <fieldset className="rounded-2xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">{copy.features}</legend>
          <div className="mt-3 flex flex-col gap-4">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={plan?.is_active ?? true} className="mt-1 size-4 accent-brand" />
              <span>
                <span className="block font-medium">{copy.catalog}</span>
                <span className="mt-0.5 block text-xs text-muted">{copy.catalogHint}</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="customDomains" defaultChecked={plan?.custom_domains ?? false} className="mt-1 size-4 accent-brand" />
              <span>
                <span className="block font-medium">{copy.domains}</span>
                <span className="mt-0.5 block text-xs text-muted">{copy.domainsHint}</span>
              </span>
            </label>
            <Field label={copy.reason} htmlFor="plan-reason" required>
              <textarea
                id="plan-reason"
                name="reason"
                required
                minLength={8}
                maxLength={500}
                rows={4}
                placeholder={copy.reasonPlaceholder}
                onChange={(event) => setReasonCount(event.target.value.length)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              />
              <span className="flex justify-between gap-3 text-xs text-muted">
                <span>{copy.reasonHint}</span>
                <span>{reasonCount}/500</span>
              </span>
            </Field>
          </div>
        </fieldset>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryClassName}>{copy.cancel}</button>
        <button type="submit" className={primaryClassName}>{plan ? copy.save : createLabel}</button>
      </div>
    </form>
  );
}

function HiddenPlan({
  plan,
  active,
  locale,
  filters,
}: {
  plan: AdminPlan;
  active: boolean;
  locale: Locale;
  filters: PlanFilters;
}) {
  return (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="planId" value={plan.id} />
      <input type="hidden" name="code" value={plan.code} />
      <input type="hidden" name="name" value={plan.name} />
      <input type="hidden" name="description" value={plan.description ?? ""} />
      <input type="hidden" name="amountCents" value={plan.amount_cents} />
      <input type="hidden" name="currency" value={plan.currency} />
      <input type="hidden" name="maxBusinesses" value={plan.max_businesses} />
      <input type="hidden" name="maxProducts" value={plan.max_products} />
      <input type="hidden" name="maxThemes" value={plan.max_themes} />
      <input type="hidden" name="analyticsRetentionDays" value={plan.analytics_retention_days} />
      {active ? <input type="hidden" name="isActive" value="on" /> : null}
      {plan.custom_domains ? <input type="hidden" name="customDomains" value="on" /> : null}
      <FilterFields filters={filters} />
    </>
  );
}

function FilterFields({ filters }: { filters: PlanFilters }) {
  return (
    <>
      <input type="hidden" name="q" value={filters.q} />
      <input type="hidden" name="status" value={filters.status} />
      <input type="hidden" name="currencyFilter" value={filters.currency} />
      <input type="hidden" name="page" value={filters.page} />
    </>
  );
}

function Field({ label, htmlFor, required = false, children }: { label: string; htmlFor: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor={htmlFor} className="font-medium text-foreground">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function SummaryCard({ icon, tone, label, value, hint }: { icon: ReactNode; tone: string; label: string; value: ReactNode; hint: string }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${tone}`}>{icon}</span>
        <span>
          <span className="block text-sm text-muted">{label}</span>
          <span className="mt-0.5 block text-2xl font-semibold tabular-nums text-foreground">{value}</span>
        </span>
      </div>
      <p className="mt-3 text-xs text-muted">{hint}</p>
    </article>
  );
}

function RevenueValue({ locale, revenue, empty }: { locale: Locale; revenue: PlanSummary["revenue"]; empty: string }) {
  if (revenue === null) {
    return empty;
  }
  if (revenue.length === 0) {
    return "0";
  }
  return (
    <span className="flex flex-col">
      {revenue.map((entry) => (
        <span key={entry.currency}>{formatMoney(entry.amountCents, entry.currency, locale) || `${entry.amountCents} ${entry.currency}`}</span>
      ))}
    </span>
  );
}

function FilterTab({ href, selected, label }: { href: string; selected: boolean; label: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={selected}
      className={`inline-flex h-10 items-center rounded-xl border px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${selected ? "border-brand bg-brand/10 text-brand" : "border-line bg-surface text-muted hover:bg-surface-muted"}`}
    >
      {label}
    </Link>
  );
}

function PlanMark({ code }: { code: string }) {
  const marks: Record<string, { icon: LucideIcon; tone: string }> = {
    free: { icon: Plane, tone: "bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300" },
    starter: { icon: Leaf, tone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" },
    pro: { icon: Crown, tone: "bg-orange-100 text-brand dark:bg-orange-950/40" },
  };
  const mark = marks[code] ?? { icon: Layers, tone: "bg-surface-muted text-muted" };
  const Icon = mark.icon;
  return (
    <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${mark.tone}`}>
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}
