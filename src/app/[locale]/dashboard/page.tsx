import { BarChart3, Building2, ExternalLink, Link2, MoreHorizontal, Plus, Store, Timer } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Notice } from "@/components/auth/notice";
import { BusinessStats } from "@/components/dashboard/business-stats";
import { SetupProgress } from "@/components/business/setup-progress";
import { LoadingState } from "@/components/states/loading-state";
import { statusActionClassName } from "@/components/states/status-panel";
import { messageFromQuery } from "@/lib/auth/messages";
import { canEditBusiness } from "@/lib/businesses/access";
import { businessMediaUrl } from "@/lib/businesses/media-url";
import { messageFromBusinessQuery } from "@/lib/businesses/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAuthenticatedUser, getOwnProfile } from "@/modules/auth";
import { businessPlanUsage } from "@/modules/billing/queries";
import { listMyBusinesses, loadBusinessCardStats } from "@/modules/businesses/queries";

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).dashboard.title, robots: { index: false, follow: false } };
}

export default async function DashboardPage({ params, searchParams }: DashboardPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col justify-center">
          <LoadingState label={dict.states.loading} />
        </main>
      }
    >
      <DashboardContent locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: DashboardPageProps["searchParams"];
}) {
  await connection();
  const query = await searchParams;
  const dict = getDictionary(locale);
  const copy = dict.business;
  const home = dict.dashboard;
  const authNotice = messageFromQuery(query.notice);
  const businessNotice = messageFromBusinessQuery(query.notice);
  const user = await getAuthenticatedUser();
  const profile = user ? await getOwnProfile() : null;
  const displayName = profile?.full_name || profile?.email || user?.email || "";
  const memberships = user ? await listMyBusinesses() : [];
  const cardStats = await loadBusinessCardStats(memberships.map((business) => business.id));
  let usage: { used: number; limit: number; canAdd: boolean } | null = null;
  if (user) {
    try {
      usage = await businessPlanUsage(user.id);
    } catch {
      usage = null;
    }
  }
  const canAdd = usage?.canAdd ?? true;
  const roleLabel = {
    owner: home.roleOwner,
    manager: home.roleManager,
    editor: home.roleEditor,
  };

  return (
    <main className="flex flex-1 flex-col">
      <h1 className="text-3xl font-semibold tracking-tight">{displayName ? home.welcome.replace("{name}", displayName) : home.title}</h1>
      <p className="mt-2 text-sm text-muted">{home.homeDescription}</p>
      {authNotice === "password_updated" ? (
        <div className="mt-6">
          <Notice tone="success">{dict.messages.password_updated}</Notice>
        </div>
      ) : null}
      {businessNotice === "deleted" ? (
        <div className="mt-6">
          <Notice tone="success">{copy.messages.deleted}</Notice>
        </div>
      ) : null}
      {memberships.length === 0 ? (
        <section className="mt-8 max-w-xl rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-semibold">{copy.onboardingTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{copy.onboardingDescription}</p>
          <ol className="mt-4 list-decimal space-y-2 ps-5 text-sm leading-6">
            {copy.onboarding.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {memberships.map((business) => {
            const logo = businessMediaUrl(business.logoPath);
            const dashboardHref = `/${locale}/dashboard/businesses/${business.id}`;
            const settingsHref = `${dashboardHref}/settings`;
            const stats = cardStats.get(business.id) ?? { users: null, scans: null, categories: null, products: null };
            return (
              <article key={business.id} className="rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="" className="size-14 rounded-2xl object-cover" />
                    ) : (
                      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-muted text-muted">
                        <Store className="size-6" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{business.name}</h2>
                      <p className="mt-0.5 text-sm text-muted">
                        {copy.types[business.businessType]} · {roleLabel[business.role]} · {business.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/${locale}/menu/${business.slug}`} target="_blank" rel="noreferrer" className={statusActionClassName}>
                      {home.openPublicMenu}
                      <ExternalLink className="ms-2 size-4" aria-hidden="true" />
                    </Link>
                    <details className="relative">
                      <summary aria-label={home.moreActions} className="inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-line hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </summary>
                      <div className="absolute end-0 z-10 mt-2 w-48 rounded-xl border border-line bg-surface p-1 text-sm shadow-[var(--shadow-card)]">
                        <Link href={dashboardHref} className="block rounded-lg px-3 py-2 hover:bg-surface-muted">{home.openDashboard}</Link>
                        {canEditBusiness(business.role) ? <Link href={settingsHref} className="block rounded-lg px-3 py-2 hover:bg-surface-muted">{copy.settingsLink}</Link> : null}
                      </div>
                    </details>
                  </div>
                </div>
                <div className="mt-4">
                  <BusinessStats
                    locale={locale}
                    users={stats.users}
                    scans={stats.scans}
                    categories={stats.categories}
                    products={stats.products}
                    usersLabel={home.statUsers}
                    scansLabel={home.statScans}
                    categoriesLabel={home.categories}
                    productsLabel={home.statProducts}
                    usersHint={home.statUsersHint}
                    scansHint={home.statScansHint}
                    categoriesHint={home.statCategoriesHint}
                    productsHint={home.statProductsHint}
                    unavailableLabel={home.statUnavailable}
                  />
                </div>
                <div className="mt-4">
                  <SetupProgress
                    copy={copy}
                    business={business}
                    hint={home.setupHint}
                    completedLabel={home.completed}
                    allDoneLabel={home.allSteps}
                    remainingLabel={home.stepsLeft}
                    settingsHref={canEditBusiness(business.role) ? settingsHref : undefined}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
      <section className="my-4 rounded-3xl border border-dashed border-orange-200 bg-orange-50/40 p-4 dark:border-orange-950/50 dark:bg-orange-950/10 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-brand dark:bg-orange-950/50">
              <Store className="size-5" aria-hidden="true" />
            </span>
            <span>
              <h2 className="text-base font-semibold">{home.addNewTitle}</h2>
              <p className="mt-1 text-sm text-muted">{home.addNewDescription}</p>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {usage ? <PlanUsage used={usage.used} limit={usage.limit} label={home.planUsageLabel} value={home.planUsage} /> : null}
            {canAdd ? (
              <Link href={`/${locale}/dashboard/businesses/new`} className={statusActionClassName}>
                <Plus className="me-2 size-4" aria-hidden="true" />
                {home.addNewButton}
              </Link>
            ) : (
              <p className="text-sm text-muted">{copy.messages.plan_limit}</p>
            )}
          </div>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Feature icon={<Building2 className="size-4" />} title={home.addFeatures.locationsTitle} body={home.addFeatures.locationsBody} tone="bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300" />
          <Feature icon={<Timer className="size-4" />} title={home.addFeatures.setupTitle} body={home.addFeatures.setupBody} tone="bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300" />
          <Feature icon={<BarChart3 className="size-4" />} title={home.addFeatures.controlTitle} body={home.addFeatures.controlBody} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" />
          <Feature icon={<Link2 className="size-4" />} title={home.addFeatures.dashboardTitle} body={home.addFeatures.dashboardBody} tone="bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300" />
        </ul>
      </section>
    </main>
  );
}

function PlanUsage({ used, limit, label, value }: { used: number; limit: number; label: string; value: string }) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const text = value.replace("{used}", String(used)).replace("{limit}", String(limit));
  return (
    <div className="min-w-36">
      <p className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium text-muted">{label}</span>
        <span className="font-semibold">{text}</span>
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-950" aria-hidden="true">
        <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Feature({ icon, title, body, tone }: { icon: ReactNode; title: string; body: string; tone: string }) {
  return (
    <li className="flex items-start gap-3 border-line sm:border-s sm:ps-4 sm:first:border-s-0 sm:first:ps-0">
      <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <span>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">{body}</p>
      </span>
    </li>
  );
}
