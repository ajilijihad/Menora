import type { Metadata } from "next";
import { Calendar, Check, Clock, Crown, FileText, HelpCircle, Leaf, Zap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { Notice } from "@/components/auth/notice";
import { BillingRefresh } from "@/components/billing/billing-refresh";
import { LoadingState } from "@/components/states/loading-state";
import type { PlanLimits } from "@/lib/billing/entitlements";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/i18n/format";
import type { BillingCopy } from "@/lib/i18n/billing-copy";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAuthenticatedUser } from "@/modules/auth";
import { cancelPlanFormAction, requestPlanFormAction, startCheckoutAction } from "@/modules/billing/checkout-actions";
import { loadAccountBilling, loadAccountPayments, type AccountBilling, type PaymentHistoryItem } from "@/modules/billing/queries";

type BillingPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const successNotices = new Set(["paid", "requested", "saved", "canceled", "checkout_canceled", "activated", "renewed"]);

export async function generateMetadata({ params }: BillingPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).billing.pageTitle, robots: { index: false, follow: false } };
}

export default function BillingPage({ params, searchParams }: BillingPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col justify-center">
          <LoadingState />
        </main>
      }
    >
      <BillingContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatWhen(value: string | null, locale: Locale, empty: string): string {
  if (!value) {
    return empty;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return empty;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function noticeMessage(copy: BillingCopy, notice: string | undefined): { tone: "success" | "error"; text: string } | null {
  if (!notice || !(notice in copy.messages)) {
    return null;
  }

  const key = notice as keyof BillingCopy["messages"];
  return { tone: successNotices.has(notice) ? "success" : "error", text: copy.messages[key] };
}

function usagePercent(used: number, limit: number): number | null {
  if (!Number.isFinite(limit) || limit <= 0) {
    return null;
  }

  return Math.min(100, Math.round((used / limit) * 100));
}

function planFeatures(plan: PlanLimits, copy: BillingCopy): string[] {
  return [
    plan.maxBusinesses === 1 ? copy.oneBusiness : fill(copy.manyBusinesses, { count: plan.maxBusinesses }),
    fill(copy.productLimit, { count: plan.maxProducts }),
    fill(copy.themeLimit, { count: plan.maxThemes }),
    fill(copy.analyticsLimit, { count: plan.analyticsRetentionDays }),
    `${copy.domains}: ${plan.customDomains ? copy.domainsYes : copy.domainsNo}`,
  ];
}

async function BillingContent({
  params,
  searchParams,
}: {
  params: BillingPageProps["params"];
  searchParams: BillingPageProps["searchParams"];
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    notFound();
  }

  const [billing, payments, query] = await Promise.all([
    loadAccountBilling(user.id),
    loadAccountPayments(user.id),
    searchParams,
  ]);
  const copy = getDictionary(locale).billing;
  const home = getDictionary(locale).dashboard;
  const notice = noticeMessage(copy, first(query.notice));

  if (!billing) {
    return (
      <main className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted">
            <Link href={`/${locale}/dashboard`} className="hover:text-foreground">{copy.breadcrumbDashboard}</Link>
            <span aria-hidden="true"> / </span>
            <span className="text-foreground">{copy.pageTitle}</span>
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{copy.pageTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{copy.pageDescription}</p>
        </div>
        <section className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold">{home.addNewTitle}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">{home.addNewDescription}</p>
          <Link href={`/${locale}/dashboard/businesses/new`} className="mt-5 inline-flex h-11 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover">
            {home.addNewButton}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <BillingBody
      locale={locale}
      copy={copy}
      billing={billing}
      payments={payments}
      notice={notice}
    />
  );
}

function BillingBody({
  locale,
  copy,
  billing,
  payments,
  notice,
}: {
  locale: Locale;
  copy: BillingCopy;
  billing: AccountBilling;
  payments: PaymentHistoryItem[];
  notice: { tone: "success" | "error"; text: string } | null;
}) {
  const paid = billing.entitlement.paid;
  const expires = formatWhen(billing.subscription?.currentPeriodEnd ?? null, locale, copy.openEnded);
  const businessPercent = usagePercent(billing.businessCount, billing.entitlement.maxBusinesses);

  return (
    <main className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href={`/${locale}/dashboard`} className="hover:text-foreground">{copy.breadcrumbDashboard}</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{copy.pageTitle}</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{copy.pageTitle}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{copy.pageDescription}</p>
      </div>
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.85fr)]">
        <article className="relative overflow-hidden rounded-3xl border border-orange-100 bg-[linear-gradient(120deg,#fff8f4_0%,#ffffff_58%)] p-5 shadow-[var(--shadow-card)] dark:border-orange-900/40 dark:bg-[linear-gradient(120deg,#2a160f_0%,#101c2d_62%)] sm:p-6">
          <div className="pointer-events-none absolute -end-8 -top-10 size-40 rounded-full bg-orange-200/70 blur-2xl dark:bg-orange-500/20" aria-hidden="true" />
          <div className="pointer-events-none absolute end-16 top-8 size-16 rounded-full border border-orange-200/80 dark:border-orange-400/20" aria-hidden="true" />
          <p className="text-xs font-semibold tracking-[0.14em] text-muted">{copy.current}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold">{billing.entitlement.name}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {copy.statuses[billing.entitlement.effectiveStatus]}
            </span>
          </div>
          {billing.entitlement.description ? <p className="mt-2 max-w-xl text-sm text-muted">{billing.entitlement.description}</p> : null}
          {billing.requestedPlan ? (
            <p className="mt-2 text-sm text-muted">{copy.requested}: {billing.requestedPlan.name}</p>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <UsageMeter
              label={copy.businesses}
              value={fill(copy.usageLine, { used: billing.businessCount, limit: billing.entitlement.maxBusinesses })}
              percent={businessPercent}
            />
            <UsageMeter
              label=""
              value={fill(copy.productLimit, { count: billing.entitlement.maxProducts })}
              percent={null}
            />
          </div>
          <a href="#plans" className="mt-5 inline-flex h-10 items-center rounded-full border border-brand/30 bg-white/80 px-4 text-sm font-semibold text-brand dark:bg-transparent">
            {copy.managePlan}
          </a>
        </article>
        <aside className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          {paid ? (
            <>
              <SummaryRow icon={<Calendar className="size-4" />} label={copy.expiration} value={expires} />
              <p className="mt-3 text-2xl font-semibold">
                {formatMoney(billing.entitlement.amountCents, billing.entitlement.currency, locale)}
                <span className="ms-1 text-sm font-medium text-muted">{copy.perMonth}</span>
              </p>
              <p className="mt-2 text-sm text-muted">{copy.manualRenewal}</p>
            </>
          ) : (
            <>
              <SummaryRow icon={<Calendar className="size-4" />} label={copy.amountLabel} value={copy.noPaymentDue} />
              <p className="mt-3 text-2xl font-semibold">{formatMoney(billing.entitlement.amountCents, billing.entitlement.currency, locale)}</p>
              <SummaryRow icon={<Clock className="size-4" />} label={copy.billingPeriod} value={copy.openEnded} />
              <p className="mt-4 rounded-2xl bg-blue-50 px-3 py-3 text-sm text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">{copy.upgradeHint}</p>
            </>
          )}
        </aside>
      </section>
      <section id="plans" className="scroll-mt-24">
        <h2 className="text-xl font-semibold">{copy.choose}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{copy.manualRenewal}</p>
        <ul className="mt-4 grid gap-4 lg:grid-cols-3">
          {billing.plans.map((plan) => {
            const current = plan.code === billing.entitlement.code;
            const Icon = plan.code === "starter" ? Crown : plan.code === "pro" ? Zap : Leaf;
            return (
              <li key={plan.code} className="flex flex-col rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
                <span className="grid size-10 place-items-center rounded-2xl bg-orange-50 text-brand dark:bg-orange-500/10">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-semibold">{formatMoney(plan.amountCents, plan.currency, locale)}</span>
                  <span className="ms-1 text-sm text-muted">{plan.amountCents === 0 ? copy.forever : copy.perMonth}</span>
                </p>
                {plan.description ? <p className="mt-2 text-sm leading-6 text-muted">{plan.description}</p> : null}
                <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                  {planFeatures(plan, copy).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {current && plan.amountCents === 0 ? (
                    <button type="button" disabled className="h-11 w-full rounded-full border border-line text-sm font-semibold text-muted">
                      {copy.currentPlanAction}
                    </button>
                  ) : plan.amountCents > 0 ? (
                    <form action={startCheckoutAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="businessId" value={billing.anchorBusinessId} />
                      <input type="hidden" name="planCode" value={plan.code} />
                      <button type="submit" className="h-11 w-full rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-hover">
                        {copy.payMonth}
                      </button>
                    </form>
                  ) : (
                    <form action={requestPlanFormAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="businessId" value={billing.anchorBusinessId} />
                      <input type="hidden" name="planCode" value={plan.code} />
                      <button type="submit" className="h-11 w-full rounded-full border border-line text-sm font-semibold">
                        {copy.useFree}
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {paid ? (
          <form action={cancelPlanFormAction} className="mt-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="businessId" value={billing.anchorBusinessId} />
            <button type="submit" className="h-10 rounded-full border border-line px-4 text-sm font-medium">
              {copy.cancelPaid}
            </button>
          </form>
        ) : null}
      </section>
      <PaymentHistory copy={copy} locale={locale} payments={payments} />
      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            <HelpCircle className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">{copy.supportTitle}</h2>
            <p className="mt-1 text-sm text-muted">{copy.supportBody}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="mt-4 flex items-start gap-3 first:mt-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-brand dark:bg-orange-500/10">{icon}</span>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function UsageMeter({ label, value, percent }: { label: string; value: string; percent: number | null }) {
  const text = label ? `${value} ${label}` : value;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{text}</span>
        {percent !== null ? <span className="text-muted">{percent}%</span> : null}
      </div>
      {percent !== null ? (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100 dark:bg-white/10">
          <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function PaymentHistory({
  copy,
  locale,
  payments,
}: {
  copy: BillingCopy;
  locale: Locale;
  payments: PaymentHistoryItem[];
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{copy.history}</h2>
          <p className="mt-1 text-sm text-muted">{copy.historyDescription}</p>
        </div>
        <BillingRefresh label={copy.refresh} />
      </div>
      {payments.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-muted dark:bg-white/5">
            <FileText className="size-6" />
          </span>
          <p className="mt-4 font-semibold">{copy.historyEmptyTitle}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">{copy.historyEmptyBody}</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-start text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-2 py-3 font-medium">{copy.date}</th>
                <th className="px-2 py-3 font-medium">{copy.descriptionColumn}</th>
                <th className="px-2 py-3 font-medium">{copy.amountLabel}</th>
                <th className="px-2 py-3 font-medium">{copy.status}</th>
                <th className="px-2 py-3 font-medium">{copy.receipt}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-line/70">
                  <td className="px-2 py-3">{formatWhen(payment.paidAt ?? payment.createdAt, locale, copy.openEnded)}</td>
                  <td className="px-2 py-3">{payment.planName ?? copy.oneMonth}</td>
                  <td className="px-2 py-3">{formatMoney(payment.amountCents, payment.currency, locale)}</td>
                  <td className="px-2 py-3"><StatusBadge copy={copy} status={payment.status} /></td>
                  <td className="px-2 py-3">
                    {payment.status === "completed" || payment.status === "refunded" ? (
                      <Link href={`/${locale}/dashboard/businesses/${payment.businessId}/billing/receipts/${payment.id}`} className="font-medium text-brand underline-offset-4 hover:underline">
                        {copy.receipt}
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ copy, status }: { copy: BillingCopy; status: PaymentHistoryItem["status"] }) {
  const tone = status === "completed"
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
    : status === "pending"
      ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
      : status === "refunded"
        ? "bg-violet-500/15 text-violet-700 dark:text-violet-200"
        : "bg-red-500/10 text-red-700 dark:text-red-300";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{copy.paymentStatuses[status]}</span>;
}
