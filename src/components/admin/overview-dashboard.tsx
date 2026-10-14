import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  Clock,
  CreditCard,
  Download,
  Globe,
  MailWarning,
  Receipt,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { DailyChart } from "@/components/analytics/daily-chart";
import { DonutChart } from "@/components/analytics/donut-chart";
import { Sparkline } from "@/components/analytics/sparkline";
import { adminWhen } from "@/components/admin/frame";
import { auditActionLabel, balancedShares, fillCount, formatAdminMoney, type AdminOverview } from "@/lib/admin/overview";
import { periodChange } from "@/lib/analytics/present";
import type { AdminCopy } from "@/lib/i18n/admin-copy";
import type { Locale } from "@/lib/i18n/locales";

const panelClassName = "rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]";

type StatusLabels = {
  active: string;
  pending: string;
  past_due: string;
  expired: string;
  canceled: string;
};

export function OverviewDashboard({
  locale,
  copy,
  statuses,
  overview,
}: {
  locale: Locale;
  copy: AdminCopy;
  statuses: StatusLabels;
  overview: AdminOverview;
}) {
  const number = new Intl.NumberFormat(locale);
  const rangeLabel = formatRange(overview.from, overview.to, locale);
  const canExport = overview.businessSeries !== null && overview.userSeries !== null;
  const subscriptionTotal = Object.values(overview.subscriptions).reduce((sum, value) => sum + value, 0);
  const subscriptionParts = (
    [
      ["active", overview.subscriptions.active, "#10B981", statuses.active],
      ["pending", overview.subscriptions.pending, "#F59E0B", statuses.pending],
      ["past_due", overview.subscriptions.past_due, "#F97316", statuses.past_due],
      ["expired", overview.subscriptions.expired, "#EF4444", statuses.expired],
      ["canceled", overview.subscriptions.canceled, "#94A3B8", statuses.canceled],
    ] as const
  ).filter((part) => part[1] > 0);
  const shares = balancedShares(subscriptionParts.map((part) => part[1]));
  const businessSeries = overview.businessSeries;
  const userSeries = overview.userSeries;
  const alerts = attentionItems(overview, copy, locale);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">{copy.description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-line bg-surface p-1 text-sm">
              {([7, 30, 90] as const).map((days) => (
                <Link
                  key={days}
                  href={`/${locale}/admin?range=${days}`}
                  aria-current={overview.preset === days ? "true" : undefined}
                  className={`rounded-lg px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    overview.preset === days ? "bg-brand/10 font-medium text-brand" : "text-muted hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  {days === 7 ? copy.range7 : days === 30 ? copy.range30 : copy.range90}
                </Link>
              ))}
            </div>
            {canExport ? (
              <a
                href={`/${locale}/admin/export?from=${overview.from}&to=${overview.to}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-medium text-white hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Download className="size-4" aria-hidden="true" />
                {copy.exportReport}
              </a>
            ) : null}
          </div>
          <form action={`/${locale}/admin`} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              {copy.from}
              <input type="date" name="from" defaultValue={overview.from} className="h-10 rounded-xl border border-line bg-surface px-2 text-sm text-foreground" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              {copy.to}
              <input type="date" name="to" defaultValue={overview.to} className="h-10 rounded-xl border border-line bg-surface px-2 text-sm text-foreground" />
            </label>
            <button
              type="submit"
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm font-medium hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {copy.apply}
            </button>
          </form>
          <p className="text-xs text-muted">{rangeLabel}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          href={`/${locale}/admin/businesses`}
          icon={Store}
          tint="bg-orange-500/10 text-brand"
          label={copy.metrics.businesses}
          value={number.format(overview.businesses)}
          detail={fillCount(copy.addedInPeriod, overview.newBusinesses, locale)}
          change={overview.previousNewBusinesses === null ? null : periodChange(overview.newBusinesses, overview.previousNewBusinesses)}
          changeLabel={copy.vsPrevious}
          locale={locale}
          sparkline={overview.businessSeries}
          sparkColor="#FF5A24"
        />
        <MetricCard
          href={`/${locale}/admin/businesses?status=active`}
          icon={Store}
          tint="bg-emerald-500/10 text-emerald-600"
          label={copy.activeBusinesses}
          value={number.format(overview.activeBusinesses)}
          detail={copy.currentTotal}
        />
        <MetricCard
          href={`/${locale}/admin/users`}
          icon={Users}
          tint="bg-violet-500/10 text-violet-600"
          label={copy.metrics.users}
          value={number.format(overview.users)}
          detail={fillCount(copy.addedInPeriod, overview.newUsers, locale)}
          change={overview.previousNewUsers === null ? null : periodChange(overview.newUsers, overview.previousNewUsers)}
          changeLabel={copy.vsPrevious}
          locale={locale}
          sparkline={overview.userSeries}
          sparkColor="#8B5CF6"
        />
        <MetricCard
          href={`/${locale}/admin/subscriptions?status=active`}
          icon={CreditCard}
          tint="bg-blue-500/10 text-blue-600"
          label={copy.metrics.activeSubscriptions}
          value={number.format(overview.subscriptions.active)}
          detail={copy.currentTotal}
        />
        <MetricCard
          href={`/${locale}/admin/subscriptions?status=pending`}
          icon={Clock}
          tint="bg-amber-500/10 text-amber-600"
          label={copy.metrics.pendingSubscriptions}
          value={number.format(overview.subscriptions.pending)}
          detail={copy.currentTotal}
        />
        <MetricCard
          href={`/${locale}/admin/subscriptions?status=expired`}
          icon={CalendarClock}
          tint="bg-red-500/10 text-red-500"
          label={copy.metrics.expiredSubscriptions}
          value={number.format(overview.subscriptions.expired)}
          detail={copy.currentTotal}
        />
        <RevenueCard locale={locale} copy={copy} overview={overview} />
        <MetricCard
          href={`/${locale}/admin/emails?status=failed`}
          icon={MailWarning}
          tint="bg-red-500/10 text-red-500"
          label={copy.metrics.failedEmails}
          value={number.format(overview.failedEmails)}
          detail={fillCount(copy.inThisRange, overview.failedEmails, locale)}
          change={overview.previousFailedEmails === null ? null : periodChange(overview.failedEmails, overview.previousFailedEmails)}
          changeLabel={copy.vsPrevious}
          locale={locale}
          invert
          sparkline={overview.emailSeries}
          sparkColor="#EF4444"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className={`${panelClassName} lg:col-span-2`}>
          <h2 className="text-base font-semibold">{copy.growthTitle}</h2>
          <p className="mt-1 text-sm text-muted">{copy.growthDescription}</p>
          <div className="mt-4">
            {businessSeries && userSeries ? (
              overview.newBusinesses + overview.newUsers === 0 ? (
                <p className="rounded-xl bg-surface-muted px-4 py-10 text-center text-sm text-muted">{copy.growthEmpty}</p>
              ) : (
                <DailyChart
                  days={overview.days.map((day, index) => ({
                    day,
                    menu: businessSeries[index] ?? 0,
                    product: userSeries[index] ?? 0,
                  }))}
                  menuLabel={copy.newBusinesses}
                  productLabel={copy.newUsers}
                  locale={locale}
                />
              )
            ) : (
              <p className="rounded-xl bg-surface-muted px-4 py-10 text-center text-sm text-muted">{copy.growthIncomplete}</p>
            )}
          </div>
        </section>
        <section className={panelClassName}>
          <h2 className="text-base font-semibold">{copy.subscriptionsTitle}</h2>
          <p className="mt-1 text-sm text-muted">{copy.subscriptionsDescription}</p>
          <div className="mt-4">
            {subscriptionTotal === 0 ? (
              <p className="rounded-xl bg-surface-muted px-4 py-10 text-center text-sm text-muted">{copy.subscriptionsEmpty}</p>
            ) : (
              <DonutChart
                total={subscriptionTotal}
                totalLabel={number.format(subscriptionTotal)}
                label={copy.subscriptionsTitle}
                slices={subscriptionParts.map((part, index) => ({
                  label: part[3],
                  value: part[1],
                  color: part[2],
                  percent: `${number.format(shares[index] ?? 0)}%`,
                }))}
              />
            )}
          </div>
          <p className="mt-3 text-xs text-muted">{copy.subscriptionsNote}</p>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className={`${panelClassName} lg:col-span-2`}>
          <h2 className="text-base font-semibold">{copy.activityTitle}</h2>
          <p className="mt-1 text-sm text-muted">{copy.activityDescription}</p>
          <div className="mt-4">
            {overview.activity === null ? (
              <p className="rounded-xl bg-surface-muted px-4 py-10 text-center text-sm text-muted">{copy.activityFailed}</p>
            ) : overview.activity.length === 0 ? (
              <p className="rounded-xl bg-surface-muted px-4 py-10 text-center text-sm text-muted">{copy.activityEmpty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-start text-sm">
                  <thead className="text-xs text-muted">
                    <tr className="border-b border-line">
                      <th className="px-2 py-2 font-medium">{copy.columnDate}</th>
                      <th className="px-2 py-2 font-medium">{copy.columns.action}</th>
                      <th className="px-2 py-2 font-medium">{copy.details}</th>
                      <th className="px-2 py-2 font-medium">{copy.columnAdministrator}</th>
                      <th className="px-2 py-2 font-medium">{copy.columnStatus}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.activity.map((row) => (
                      <tr key={row.id} className="border-b border-line last:border-0">
                        <td className="whitespace-nowrap px-2 py-3 text-muted">{adminWhen(row.createdAt, locale, copy.empty)}</td>
                        <td className="px-2 py-3 font-medium">{auditActionLabel(row.action, copy.auditActions)}</td>
                        <td className="max-w-xs truncate px-2 py-3 text-muted">{row.reason}</td>
                        <td className="px-2 py-3">{row.self ? copy.you : row.actor || copy.administrator}</td>
                        <td className="px-2 py-3">
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            {copy.recorded}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
        <section className={panelClassName}>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold">{copy.attentionTitle}</h2>
              <p className="mt-1 text-sm text-muted">{copy.attentionDescription}</p>
            </div>
          </div>
          {alerts.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-muted px-4 py-8 text-center text-sm text-muted">{copy.attentionEmpty}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-1">
              {alerts.map((alert) => (
                <li key={alert.href}>
                  <Link href={alert.href} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${alert.tint}`}>
                      <alert.icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{alert.title}</span>
                      <span className="block truncate text-xs text-muted">{alert.detail}</span>
                    </span>
                    <span className="tabular-nums text-sm font-semibold">{number.format(alert.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  href,
  icon: Icon,
  tint,
  label,
  value,
  detail,
  change = null,
  changeLabel,
  locale,
  invert = false,
  sparkline,
  sparkColor,
}: {
  href: string;
  icon: LucideIcon;
  tint: string;
  label: string;
  value: string;
  detail: string;
  change?: number | null;
  changeLabel?: string;
  locale?: string;
  invert?: boolean;
  sparkline?: number[] | null;
  sparkColor?: string;
}) {
  return (
    <Link href={href} className={`${panelClassName} block hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-9 place-items-center rounded-xl ${tint}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {sparkline && sparkColor ? <Sparkline values={sparkline} color={sparkColor} /> : null}
      </div>
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span>{detail}</span>
        <Trend change={change} label={changeLabel} invert={invert} locale={locale} />
      </div>
    </Link>
  );
}

function RevenueCard({ locale, copy, overview }: { locale: Locale; copy: AdminCopy; overview: AdminOverview }) {
  const change = revenueChange(overview.revenue, overview.previousRevenue);
  const single = overview.revenue?.length === 1 ? overview.revenue[0] : null;
  const value = overview.revenue === null
    ? "—"
    : single
      ? formatAdminMoney(single.amountCents, single.currency, locale)
      : overview.revenue.length === 0
        ? "0"
        : "";
  const detail = overview.revenue === null
    ? copy.revenueUnavailable
    : overview.revenue.length > 1
      ? copy.revenueMixed
      : overview.revenue.length === 0
        ? copy.revenueNone
        : copy.revenueDetail;

  return (
    <Link href={`/${locale}/admin/payments?status=completed`} className={`${panelClassName} block hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <Banknote className="size-4" aria-hidden="true" />
        </span>
        {overview.revenueSeries ? <Sparkline values={overview.revenueSeries} color="#10B981" /> : null}
      </div>
      <p className="mt-3 text-sm text-muted">{copy.revenue}</p>
      {value ? <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p> : null}
      {overview.revenue && overview.revenue.length > 1 ? (
        <ul className="mt-2 flex flex-col gap-1 text-sm font-medium tabular-nums">
          {overview.revenue.map((entry) => (
            <li key={entry.currency}>{formatAdminMoney(entry.amountCents, entry.currency, locale)}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span>{detail}</span>
        <Trend change={change} label={copy.vsPrevious} locale={locale} />
      </div>
    </Link>
  );
}

function Trend({ change, label, invert = false, locale = "en" }: { change: number | null; label?: string; invert?: boolean; locale?: string }) {
  if (change === null || !label) {
    return null;
  }

  const good = invert ? change < 0 : change > 0;
  const bad = invert ? change > 0 : change < 0;
  const tone = change === 0 ? "text-muted" : good ? "text-emerald-600" : bad ? "text-red-500" : "text-muted";
  const Icon = change < 0 ? ArrowDownRight : ArrowUpRight;
  const formatted = new Intl.NumberFormat(locale).format(Math.abs(change));

  return (
    <span className={`inline-flex items-center gap-1 font-medium ${tone}`}>
      {change === 0 ? null : <Icon className="size-3.5" aria-hidden="true" />}
      {change > 0 ? "+" : change < 0 ? "−" : ""}
      {formatted}%
      <span className="font-normal text-muted">{label}</span>
    </span>
  );
}

function attentionItems(overview: AdminOverview, copy: AdminCopy, locale: Locale) {
  const items: Array<{ href: string; title: string; detail: string; count: number; icon: LucideIcon; tint: string }> = [];
  if (overview.failedEmailBacklog > 0) {
    items.push({
      href: `/${locale}/admin/emails?status=failed`,
      title: copy.attentionFailedEmails,
      detail: fillCount(copy.attentionFailedEmailsDetail, overview.failedEmailBacklog, locale),
      count: overview.failedEmailBacklog,
      icon: MailWarning,
      tint: "bg-red-500/10 text-red-500",
    });
  }
  if (overview.subscriptions.pending > 0) {
    items.push({
      href: `/${locale}/admin/subscriptions?status=pending`,
      title: copy.attentionPending,
      detail: fillCount(copy.attentionPendingDetail, overview.subscriptions.pending, locale),
      count: overview.subscriptions.pending,
      icon: Clock,
      tint: "bg-amber-500/10 text-amber-600",
    });
  }
  if (overview.subscriptions.expired > 0) {
    items.push({
      href: `/${locale}/admin/subscriptions?status=expired`,
      title: copy.attentionExpired,
      detail: fillCount(copy.attentionExpiredDetail, overview.subscriptions.expired, locale),
      count: overview.subscriptions.expired,
      icon: CalendarClock,
      tint: "bg-red-500/10 text-red-500",
    });
  }
  if (overview.pendingDomains > 0) {
    items.push({
      href: `/${locale}/admin/domains?status=pending`,
      title: copy.attentionDomains,
      detail: fillCount(copy.attentionDomainsDetail, overview.pendingDomains, locale),
      count: overview.pendingDomains,
      icon: Globe,
      tint: "bg-blue-500/10 text-blue-600",
    });
  }
  if (overview.failedPayments > 0) {
    items.push({
      href: `/${locale}/admin/payments?status=failed`,
      title: copy.attentionPayments,
      detail: fillCount(copy.attentionPaymentsDetail, overview.failedPayments, locale),
      count: overview.failedPayments,
      icon: Banknote,
      tint: "bg-red-500/10 text-red-500",
    });
  }
  if (overview.subscriptions.past_due > 0) {
    items.push({
      href: `/${locale}/admin/subscriptions?status=past_due`,
      title: copy.attentionPastDue,
      detail: fillCount(copy.attentionPastDueDetail, overview.subscriptions.past_due, locale),
      count: overview.subscriptions.past_due,
      icon: Receipt,
      tint: "bg-orange-500/10 text-brand",
    });
  }
  return items;
}

function revenueChange(
  current: AdminOverview["revenue"],
  previous: AdminOverview["previousRevenue"],
): number | null {
  if (!current || !previous || previous.length !== 1) {
    return null;
  }
  const previousAmount = previous[0]?.amountCents ?? 0;
  const previousCurrency = previous[0]?.currency;
  if (current.length === 0) {
    return periodChange(0, previousAmount);
  }
  if (current.length === 1 && current[0]?.currency === previousCurrency) {
    return periodChange(current[0]?.amountCents ?? 0, previousAmount);
  }
  return null;
}

function formatRange(from: string, to: string, locale: string): string {
  const format = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${from} – ${to}`;
  }
  return `${format.format(start)} – ${format.format(end)}`;
}
