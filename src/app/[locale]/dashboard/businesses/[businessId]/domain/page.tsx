import type { Metadata } from "next";
import { CircleHelp, Globe, Link2, Lock, Shield } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { Notice } from "@/components/auth/notice";
import { CopyValue, PendingSubmit } from "@/components/dashboard/domain-controls";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel } from "@/components/states/status-panel";
import { canEditBusiness } from "@/lib/businesses/access";
import { verificationName } from "@/lib/domains/host";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { InsightsCopy } from "@/lib/i18n/insights-copy";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMyBusiness } from "@/modules/businesses/queries";
import { checkDomainAction, removeDomainAction, submitDomainAction } from "@/modules/domains/actions";

type PageProps = {
  params: Promise<{ locale: string; businessId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type DomainStatus = "pending" | "verified" | "active" | "disabled";

type DomainRow = {
  id: string;
  hostname: string;
  status: DomainStatus;
  verification_token: string;
  verified_at: string | null;
  last_checked_at: string | null;
};

type StepState = "idle" | "current" | "done" | "failed" | "waiting";

const successNotices = new Set(["verified", "removed"]);
const warningNotices = new Set(["submitted", "missing", "rate_limited"]);
const failedChecks = new Set(["missing", "mismatch", "dns_error"]);

const primaryButtonClassName =
  "inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60";

const fieldClassName =
  "h-12 w-full rounded-xl border border-line bg-surface ps-11 pe-3 text-sm text-foreground outline-none placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).insights.domain, robots: { index: false, follow: false } };
}

export default function DomainPage({ params, searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col justify-center">
          <LoadingState />
        </main>
      }
    >
      <DomainContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isStatus(value: string): value is DomainStatus {
  return value === "pending" || value === "verified" || value === "active" || value === "disabled";
}

function formatWhen(value: string | null, locale: Locale): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function badgeClass(status: DomainStatus): string {
  if (status === "active" || status === "verified") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  }

  if (status === "pending") {
    return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
  }

  return "bg-surface-muted text-muted";
}

function stepStates(status: DomainStatus | null, notice: string | undefined): StepState[] {
  if (!status || status === "disabled") {
    return ["idle", "idle", "idle", "idle"];
  }

  const verified = status === "verified" || status === "active";
  return [
    "done",
    verified ? "done" : "current",
    status === "pending" && notice && failedChecks.has(notice) ? "failed" : verified ? "done" : "idle",
    status === "active" ? "done" : status === "verified" ? "waiting" : "idle",
  ];
}

async function DomainContent({
  params,
  searchParams,
}: {
  params: PageProps["params"];
  searchParams: PageProps["searchParams"];
}) {
  const { locale, businessId } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const business = await getMyBusiness(businessId);
  if (!business || !canEditBusiness(business.role)) {
    notFound();
  }

  const dict = getDictionary(locale);
  const copy = dict.insights;
  const query = await searchParams;
  const notice = first(query.notice);
  const supabase = await createServerSupabaseClient();
  await supabase.rpc("sync_business_domains", { target_business_id: businessId });
  const [allowed, domains] = await Promise.all([
    supabase.rpc("custom_domains_allowed", { target_business_id: businessId }),
    supabase
      .from("custom_domains")
      .select("id, hostname, status, verification_token, verified_at, last_checked_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
  ]);

  if (allowed.error || domains.error) {
    return (
      <main>
        <StatusPanel title={dict.states.errorTitle} description={dict.states.errorDescription} />
      </main>
    );
  }

  const rows = (domains.data ?? []).flatMap((row) => {
    if (!isStatus(row.status)) {
      return [];
    }

    return [{ ...row, status: row.status }];
  });
  const open = rows.find((domain) => domain.status !== "disabled") ?? null;
  const retired = rows.filter((domain) => domain.status === "disabled");
  const billingHref = `/${locale}/dashboard/billing`;
  const showTxt = open?.status === "pending" || open?.status === "verified";
  const noticeText = notice && copy.notices[notice] ? copy.notices[notice] : null;

  return (
    <main className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-brand" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.domain}</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted">{copy.domainDescription}</p>
        </div>
        <a href="#domain-help" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
          <CircleHelp className="size-4" aria-hidden="true" />
          {copy.learnMore}
        </a>
      </header>

      {noticeText && successNotices.has(notice ?? "") ? <Notice tone="success">{noticeText}</Notice> : null}
      {noticeText && !successNotices.has(notice ?? "") && !warningNotices.has(notice ?? "") ? <Notice tone="error">{noticeText}</Notice> : null}
      {noticeText && warningNotices.has(notice ?? "") ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          {noticeText}
        </p>
      ) : null}

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.8fr)]">
        {allowed.data && !open ? (
          <article className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
            <CardHeading icon={<Globe className="size-5" />} title={copy.connectTitle} description={copy.connectDescription} />
            <form action={submitDomainAction} className="mt-5 flex flex-col gap-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="businessId" value={businessId} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">{copy.hostname}</span>
                  <Globe className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    className={fieldClassName}
                    name="hostname"
                    required
                    maxLength={253}
                    placeholder="menu.example.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="url"
                  />
                </label>
                <PendingSubmit idle={copy.submit} pending={copy.adding} className={primaryButtonClassName} />
              </div>
              <p className="text-xs text-muted">{copy.hostnameHint}</p>
            </form>
            <SetupSteps copy={copy} states={stepStates(null, notice)} />
          </article>
        ) : null}

        {!allowed.data && !open ? (
          <article className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
            <CardHeading icon={<Lock className="size-5" />} title={copy.premiumTitle} description={copy.lockedDescription} />
            <Link href={billingHref} className={`${primaryButtonClassName} mt-5`}>
              {copy.viewPlans}
            </Link>
            <SetupSteps copy={copy} states={stepStates(null, notice)} />
          </article>
        ) : null}

        {open ? (
          <article className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
            <CardHeading icon={<Globe className="size-5" />} title={copy.connectTitle} description={copy.connectDescription} />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <p dir="ltr" className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-line bg-surface-muted px-4 text-sm font-medium break-all">
                {open.hostname}
              </p>
              {open.status === "pending" ? (
                <form action={checkDomainAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="businessId" value={businessId} />
                  <input type="hidden" name="domainId" value={open.id} />
                  <PendingSubmit idle={copy.check} pending={copy.checking} className={primaryButtonClassName} />
                </form>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-muted">
              {open.status === "pending" ? copy.dnsWait : open.status === "active" ? copy.activeNote : copy.verifiedNote}
            </p>
            <RemoveForm locale={locale} businessId={businessId} domainId={open.id} copy={copy} />
            <SetupSteps copy={copy} states={stepStates(open.status, notice)} />
          </article>
        ) : null}

        <StatusCard
          copy={copy}
          locale={locale}
          domain={open}
          allowed={Boolean(allowed.data)}
        />
      </section>

      <DnsCard copy={copy} domain={showTxt ? open : null} />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <CardHeading icon={<Link2 className="size-5" />} title={copy.routingTitle} description={copy.routingBody} />
        </article>
        <article className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <CardHeading icon={<Shield className="size-5" />} title={copy.certificateTitle} description={copy.certificateBody} />
          <p className="mt-4 rounded-2xl border border-line bg-surface-muted px-3 py-2 text-sm text-muted">{copy.sslHonest}</p>
          {open?.status === "active" ? <p className="mt-3 text-sm text-foreground">{copy.activeNote}</p> : null}
        </article>
      </section>

      {open?.status === "verified" ? (
        <section className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold">{copy.activationTitle}</h2>
          <p className="mt-2 text-sm text-muted">{copy.activationBody}</p>
          <p className="mt-2 text-sm text-foreground">{copy.verifiedNote}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">{copy.domainId}</span>
            <code dir="ltr" className="rounded-lg bg-surface-muted px-2 py-1 text-xs break-all">{open.id}</code>
            <CopyValue value={open.id} label={copy.copyValue} copiedLabel={copy.copied} />
          </div>
        </section>
      ) : null}

      {retired.length > 0 ? (
        <section className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-base font-semibold">{copy.statuses.disabled}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {retired.map((domain) => (
              <li key={domain.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                <span dir="ltr" className="text-sm break-all">{domain.hostname}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(domain.status)}`}>{copy.statuses.disabled}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="domain-help" className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">{copy.helpTitle}</h2>
        <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
          {copy.helpItems.map((item) => (
            <li key={item} className="rounded-2xl bg-surface-muted px-3 py-2">{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function CardHeading({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-brand">{icon}</span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

function SetupSteps({ copy, states }: { copy: InsightsCopy; states: StepState[] }) {
  const steps = [
    { label: copy.steps.add, hint: copy.steps.addHint },
    { label: copy.steps.dns, hint: copy.steps.dnsHint },
    { label: copy.steps.verify, hint: copy.steps.verifyHint },
    { label: copy.steps.serve, hint: states[3] === "waiting" ? copy.stepNeedsHost : copy.steps.serveHint },
  ];

  return (
    <ol className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4" aria-label={copy.stepsTitle}>
      {steps.map((step, index) => (
        <li key={step.label} className="relative min-w-0">
          {index < steps.length - 1 ? (
            <span className="absolute top-4 start-8 hidden h-px w-[calc(100%-1.25rem)] border-t border-dashed border-line sm:block" aria-hidden="true" />
          ) : null}
          <span className={`inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold ${stepMark(states[index] ?? "idle")}`}>
            {index + 1}
          </span>
          <p className="mt-2 text-sm font-semibold">{step.label}</p>
          <p className="text-xs text-muted">{step.hint}</p>
        </li>
      ))}
    </ol>
  );
}

function stepMark(state: StepState): string {
  if (state === "done") {
    return "bg-emerald-500 text-white";
  }

  if (state === "current" || state === "waiting") {
    return "bg-brand text-white";
  }

  if (state === "failed") {
    return "bg-red-500 text-white";
  }

  return "bg-surface-muted text-muted";
}

function StatusCard({
  copy,
  locale,
  domain,
  allowed,
}: {
  copy: InsightsCopy;
  locale: Locale;
  domain: DomainRow | null;
  allowed: boolean;
}) {
  const verifiedAt = formatWhen(domain?.verified_at ?? null, locale);
  const lastChecked = formatWhen(domain?.last_checked_at ?? null, locale);

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="text-lg font-semibold">{copy.statusTitle}</h2>
      {domain ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p dir="ltr" className="text-base font-semibold break-all">{domain.hostname}</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(domain.status)}`}>
              {copy.statuses[domain.status]}
            </span>
          </div>
          <dl className="grid gap-1 text-sm text-muted">
            {verifiedAt ? (
              <div className="flex flex-wrap gap-2">
                <dt>{copy.verifiedAt}</dt>
                <dd className="text-foreground">{verifiedAt}</dd>
              </div>
            ) : null}
            {lastChecked ? (
              <div className="flex flex-wrap gap-2">
                <dt>{copy.lastChecked}</dt>
                <dd className="text-foreground">{lastChecked}</dd>
              </div>
            ) : null}
          </dl>
          <div className="flex flex-wrap gap-2">
            <CopyValue value={domain.hostname} label={copy.copyValue} copiedLabel={copy.copied} />
            {domain.status === "active" ? (
              <a
                href={`https://${domain.hostname}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-full bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover"
              >
                {copy.visit}
              </a>
            ) : null}
          </div>
          {domain.status === "verified" ? <p className="text-sm text-muted">{copy.verifiedNote}</p> : null}
          {domain.status === "active" ? <p className="text-sm text-muted">{copy.activeNote}</p> : null}
          {domain.status === "pending" ? <p className="text-sm text-muted">{copy.dnsWait}</p> : null}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center px-2 py-6 text-center">
          <span className="relative inline-flex size-24 items-center justify-center rounded-full bg-orange-500/10 text-brand">
            <Globe className="size-10" aria-hidden="true" />
            <span className="absolute -end-1 top-3 size-2 rounded-full bg-brand/70" />
            <span className="absolute end-2 -top-1 size-1.5 rounded-full bg-amber-400" />
          </span>
          <span className="mt-4 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted">{copy.notConfigured}</span>
          <h3 className="mt-3 text-lg font-semibold">{copy.noDomainTitle}</h3>
          <p className="mt-1 max-w-xs text-sm text-muted">{allowed ? copy.none : copy.lockedDescription}</p>
        </div>
      )}
    </article>
  );
}

function DnsCard({ copy, domain }: { copy: InsightsCopy; domain: DomainRow | null }) {
  const record = domain
    ? {
        type: "TXT",
        host: verificationName(domain.hostname),
        value: domain.verification_token,
        pending: domain.status === "pending",
      }
    : null;

  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="text-lg font-semibold">{copy.dnsTitle}</h2>
      {record ? <p className="mt-1 max-w-3xl text-sm text-muted">{copy.dnsIntro}</p> : (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          {copy.dnsEmpty}
        </p>
      )}
      {record ? (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-line md:block">
            <table className="w-full text-start text-sm">
              <thead className="bg-surface-muted text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{copy.recordType}</th>
                  <th className="px-3 py-2 font-medium">{copy.recordHost}</th>
                  <th className="px-3 py-2 font-medium">{copy.recordValue}</th>
                  <th className="px-3 py-2 font-medium">{copy.status}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-3 font-semibold text-sky-700 dark:text-sky-300">TXT</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <code dir="ltr" className="break-all">{record.host}</code>
                      <CopyValue value={record.host} label={copy.copyValue} copiedLabel={copy.copied} />
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <code dir="ltr" className="break-all">{record.value}</code>
                      <CopyValue value={record.value} label={copy.copyValue} copiedLabel={copy.copied} />
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.pending ? badgeClass("pending") : badgeClass("verified")}`}>
                      {record.pending ? copy.statuses.pending : copy.statuses.verified}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-2xl border border-line p-3 md:hidden">
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">TXT</p>
            <p className="mt-2 text-xs text-muted">{copy.recordHost}</p>
            <p dir="ltr" className="font-mono text-sm break-all">{record.host}</p>
            <div className="mt-2">
              <CopyValue value={record.host} label={copy.copyValue} copiedLabel={copy.copied} />
            </div>
            <p className="mt-3 text-xs text-muted">{copy.recordValue}</p>
            <p dir="ltr" className="font-mono text-sm break-all">{record.value}</p>
            <div className="mt-2">
              <CopyValue value={record.value} label={copy.copyValue} copiedLabel={copy.copied} />
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function RemoveForm({
  locale,
  businessId,
  domainId,
  copy,
}: {
  locale: Locale;
  businessId: string;
  domainId: string;
  copy: InsightsCopy;
}) {
  return (
    <form action={removeDomainAction} className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface-muted p-3 sm:flex-row sm:items-center sm:justify-between">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="domainId" value={domainId} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="confirm" value="yes" required className="size-4 accent-[var(--brand)]" />
        {copy.confirmRemove}
      </label>
      <PendingSubmit
        idle={copy.remove}
        pending={copy.remove}
        className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
      />
    </form>
  );
}
