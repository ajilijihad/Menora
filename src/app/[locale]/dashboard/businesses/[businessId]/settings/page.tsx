import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BusinessForm } from "@/components/business/business-form";
import { formValuesFromBusiness } from "@/components/business/form-values";
import { LoadingState } from "@/components/states/loading-state";
import { canDeleteBusiness, canEditBusiness } from "@/lib/businesses/access";
import { businessMediaUrl } from "@/lib/businesses/media-url";
import { messageFromBusinessQuery } from "@/lib/businesses/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { appOrigin } from "@/lib/menus/public-url";
import { getPublicEnv } from "@/lib/env/public";
import { getMyBusiness } from "@/modules/businesses/queries";

type SettingsPageProps = {
  params: Promise<{ locale: string; businessId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return {
    title: getDictionary(locale).business.settingsTitle,
    robots: { index: false, follow: false },
  };
}

export default async function BusinessSettingsPage({ params, searchParams }: SettingsPageProps) {
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
      <SettingsContent locale={locale} businessId={businessId} searchParams={searchParams} />
    </Suspense>
  );
}

async function SettingsContent({
  locale,
  businessId,
  searchParams,
}: {
  locale: Locale;
  businessId: string;
  searchParams: SettingsPageProps["searchParams"];
}) {
  const business = await getMyBusiness(businessId);
  if (!business) {
    notFound();
  }

  const query = await searchParams;
  const copy = getDictionary(locale).business;
  const notice = messageFromBusinessQuery(query.notice);
  const canEdit = canEditBusiness(business.role);
  let menuOrigin: string | null = null;
  try {
    menuOrigin = appOrigin(getPublicEnv().NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development");
  } catch {
    menuOrigin = null;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
      {canEdit ? (
        <BusinessForm
          locale={locale}
          copy={copy}
          mode="edit"
          businessId={business.id}
          initial={formValuesFromBusiness(business)}
          logoUrl={businessMediaUrl(business.logoPath)}
          coverUrl={businessMediaUrl(business.coverPath)}
          menuOrigin={menuOrigin}
          canDelete={canDeleteBusiness(business.role)}
          deleteHref={`/${locale}/dashboard/businesses/${business.id}/delete`}
          notice={notice}
        />
      ) : (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{copy.settingsTitle}</h1>
          <p className="mt-3 max-w-2xl text-muted">{copy.readOnly}</p>
          <Link
            href={`/${locale}/dashboard/businesses/${business.id}`}
            className="mt-6 text-sm font-medium underline-offset-4 hover:underline"
          >
            {business.name}
          </Link>
        </>
      )}
    </main>
  );
}
