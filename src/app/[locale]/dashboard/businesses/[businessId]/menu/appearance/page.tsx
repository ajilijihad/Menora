import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AppearanceEditor } from "@/components/menu/appearance-editor";
import { LoadingState } from "@/components/states/loading-state";
import { canEditBusiness, canEditMenu } from "@/lib/businesses/access";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getMyBusiness } from "@/modules/businesses/queries";
import { loadAppearancePreview } from "@/modules/menus/appearance-query";

type AppearancePageProps = {
  params: Promise<{ locale: string; businessId: string }>;
};

export async function generateMetadata({ params }: AppearancePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).appearance.title, robots: { index: false, follow: false } };
}

export default async function AppearancePage({ params }: AppearancePageProps) {
  const { locale, businessId } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <AppearanceContent locale={locale} businessId={businessId} />
    </Suspense>
  );
}

async function AppearanceContent({ locale, businessId }: { locale: Locale; businessId: string }) {
  const business = await getMyBusiness(businessId);
  if (!business || !canEditMenu(business.role)) {
    notFound();
  }

  const dict = getDictionary(locale);
  const preview = await loadAppearancePreview(business);
  const backHref = `/${locale}/dashboard/businesses/${business.id}/menu`;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <Link href={backHref} className="text-sm font-medium underline-offset-4 hover:underline">
          {dict.appearance.back}
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{dict.appearance.title}</h1>
      </div>
      <AppearanceEditor
        locale={locale}
        copy={dict.appearance}
        menuCopy={dict.menu}
        publicCopy={dict.publicMenu}
        businessId={business.id}
        backHref={backHref}
        appearance={preview.appearance}
        menu={preview.menu}
        canEdit={canEditBusiness(business.role)}
      />
    </main>
  );
}
