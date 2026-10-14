import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DeleteBusinessForm } from "@/components/business/delete-business-form";
import { Notice } from "@/components/auth/notice";
import { LoadingState } from "@/components/states/loading-state";
import { canDeleteBusiness } from "@/lib/businesses/access";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
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

  const copy = getDictionary(locale).business;
  const overviewHref = `/${locale}/dashboard/businesses/${business.id}`;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{copy.deleteTitle}</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">{copy.deleteDescription}</p>
      <p className="mt-4 text-sm font-medium">{business.slug}</p>
      {canDeleteBusiness(business.role) ? (
        <div className="mt-8">
          <DeleteBusinessForm
            locale={locale}
            copy={copy}
            businessId={business.id}
            cancelHref={overviewHref}
          />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          <Notice tone="error">{copy.messages.forbidden}</Notice>
          <Link href={overviewHref} className="text-sm font-medium underline-offset-4 hover:underline">
            {copy.cancel}
          </Link>
        </div>
      )}
    </main>
  );
}
