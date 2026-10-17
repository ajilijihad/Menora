import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ExternalLink, Settings, Store, Trash2 } from "lucide-react";
import { Suspense } from "react";

import { CopyTextButton, DeleteBusinessForm } from "@/components/business/delete-business-form";
import { Notice } from "@/components/auth/notice";
import { LoadingState } from "@/components/states/loading-state";
import { canDeleteBusiness } from "@/lib/businesses/access";
import { businessMediaUrl } from "@/lib/businesses/media-url";
import { getPublicEnv } from "@/lib/env/public";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { canonicalMenuUrl } from "@/lib/menus/public-url";
import { getMyBusiness } from "@/modules/businesses/queries";

type DeletePageProps = {
  params: Promise<{ locale: string; businessId: string }>;
};

export async function generateMetadata({ params }: DeletePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return {
    title: getDictionary(locale).business.deleteTitle,
    robots: { index: false, follow: false },
  };
}

export default async function DeleteBusinessPage({ params }: DeletePageProps) {
  const { locale, businessId } = await params;
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
      <DeleteContent locale={locale} businessId={businessId} />
    </Suspense>
  );
}

async function DeleteContent({ locale, businessId }: { locale: Locale; businessId: string }) {
  const business = await getMyBusiness(businessId);
  if (!business) {
    notFound();
  }

  const dict = getDictionary(locale);
  const copy = dict.business;
  const settingsHref = `/${locale}/dashboard/businesses/${business.id}/settings`;
  const roleLabel = {
    owner: dict.dashboard.roleOwner,
    manager: dict.dashboard.roleManager,
    editor: dict.dashboard.roleEditor,
  }[business.role];
  const logoUrl = businessMediaUrl(business.logoPath);
  let publicUrl = `/menu/${business.slug}`;
  try {
    publicUrl =
      canonicalMenuUrl(business.slug, getPublicEnv().NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development") ??
      publicUrl;
  } catch {
    publicUrl = `/menu/${business.slug}`;
  }

  return (
    <main className="flex w-full flex-1 flex-col gap-4">
      <header>
        <nav aria-label={copy.breadcrumbLabel}>
          <ol className="flex flex-wrap items-center gap-1.5 text-sm">
            <li>
              <Link
                href={settingsHref}
                className="inline-flex items-center gap-1.5 rounded-md text-muted transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Settings className="size-4" aria-hidden="true" />
                {copy.settingsTitle}
              </Link>
            </li>
            <li aria-hidden="true" className="text-muted">
              <ChevronRight className="size-3.5 rtl:rotate-180" />
            </li>
            <li className="font-medium text-brand" aria-current="page">
              {copy.dangerZone}
            </li>
          </ol>
        </nav>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{copy.deleteTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{copy.deleteDescription}</p>
      </header>

      <section className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 dark:border-red-900/60 dark:bg-red-950/30 sm:gap-4 sm:px-5">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300">
          <Trash2 className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">{copy.deleteWarningTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-red-950/80 dark:text-red-100/80">{copy.deleteWarningBody}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
          ) : (
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-muted">
              <Store className="size-6" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold text-foreground">{business.name}</h2>
            <p className="mt-0.5 break-words text-sm text-muted">
              {copy.types[business.businessType]}
              <span aria-hidden="true"> · </span>
              {roleLabel}
              <span aria-hidden="true"> · </span>
              <span dir="ltr">{business.slug}</span>
            </p>
          </div>
        </div>
        <div className="w-full min-w-0 lg:max-w-sm">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <ExternalLink className="size-3.5" aria-hidden="true" />
            {copy.publicUrlLabel}
          </p>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-background px-3 py-2">
            <p dir="ltr" className="min-w-0 flex-1 break-all text-start text-sm text-foreground">
              {readableUrl(publicUrl)}
            </p>
            <CopyTextButton value={publicUrl} label={copy.copyUrl} copiedLabel={copy.copied} />
          </div>
        </div>
      </section>

      {canDeleteBusiness(business.role) ? (
        <DeleteBusinessForm
          locale={locale}
          copy={copy}
          businessId={business.id}
          slug={business.slug}
          cancelHref={settingsHref}
        />
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <Notice tone="error">{copy.messages.forbidden}</Notice>
          <Link
            href={settingsHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line bg-surface text-sm font-medium text-foreground transition hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copy.cancelReturn}
          </Link>
        </div>
      )}
    </main>
  );
}

function readableUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname.replace(/\/$/, "")}${parsed.search}`;
  } catch {
    return url;
  }
}
