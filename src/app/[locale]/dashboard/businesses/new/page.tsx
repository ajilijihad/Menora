import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BusinessForm } from "@/components/business/business-form";
import { blankBusinessForm } from "@/components/business/form-values";
import { LoadingState } from "@/components/states/loading-state";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { appOrigin } from "@/lib/menus/public-url";
import { getPublicEnv } from "@/lib/env/public";

type NewBusinessPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: NewBusinessPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return {
    title: getDictionary(locale).business.createTitle,
    robots: { index: false, follow: false },
  };
}

export default async function NewBusinessPage({ params }: NewBusinessPageProps) {
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
      <NewBusinessContent locale={locale} />
    </Suspense>
  );
}

async function NewBusinessContent({ locale }: { locale: Locale }) {
  const copy = getDictionary(locale).business;
  let menuOrigin: string | null = null;
  try {
    menuOrigin = appOrigin(getPublicEnv().NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development");
  } catch {
    menuOrigin = null;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
      <BusinessForm
        locale={locale}
        copy={copy}
        mode="create"
        initial={blankBusinessForm()}
        logoUrl={null}
        coverUrl={null}
        menuOrigin={menuOrigin}
      />
    </main>
  );
}
