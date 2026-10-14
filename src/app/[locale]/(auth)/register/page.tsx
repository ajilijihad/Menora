import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LoginScreen } from "@/components/auth/login-screen";
import { Notice } from "@/components/auth/notice";
import { RegisterForm } from "@/components/auth/register-form";
import { LoadingState } from "@/components/states/loading-state";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv, hasPublicSupabaseEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { localizedText } from "@/lib/homepage/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { loadHomepage } from "@/modules/homepage/queries";

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).auth.registerTitle };
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <Suspense
      fallback={
        <main data-auth="" className="flex min-h-dvh flex-1 flex-col justify-center">
          <LoadingState label={dict.states.loading} />
        </main>
      }
    >
      <RegisterContent locale={locale} />
    </Suspense>
  );
}

async function RegisterContent({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  let brand = dict.brand;
  let logoUrl: string | null = null;
  try {
    const page = await loadHomepage();
    brand = localizedText(page.content.site.name, locale).trim() || dict.brand;
    logoUrl = homepageImageUrl(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, page.content.site.logoPath);
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      brand = dict.brand;
      logoUrl = null;
    }
  }

  return (
    <LoginScreen
      locale={locale}
      copy={dict}
      brand={brand}
      logoUrl={logoUrl}
      englishHref="/en/register"
      arabicHref="/ar/register"
      panelTitle={dict.auth.registerPanelTitle}
      panelBody={dict.auth.welcomeBody}
      introTitle={dict.auth.registerTitle}
      introBody={dict.auth.registerDescription}
      formFirst
      wide
    >
      {hasPublicSupabaseEnv() ? null : <Notice tone="error">{dict.messages.unconfigured}</Notice>}
      <RegisterForm locale={locale} copy={dict} />
    </LoginScreen>
  );
}
