import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginScreen } from "@/components/auth/login-screen";
import { Notice } from "@/components/auth/notice";
import { LoadingState } from "@/components/states/loading-state";
import { parseForgot } from "@/lib/auth/schemas";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv, hasPublicSupabaseEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { localizedText } from "@/lib/homepage/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { loadHomepage } from "@/modules/homepage/queries";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).auth.forgotTitle };
}

export default async function ForgotPasswordPage({ params, searchParams }: ForgotPasswordPageProps) {
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
      <ForgotPasswordContent locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function ForgotPasswordContent({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: ForgotPasswordPageProps["searchParams"];
}) {
  const query = await searchParams;
  const dict = getDictionary(locale);
  const sent = first(query.sent) === "1";
  const parsedEmail = parseForgot({ email: first(query.to) });
  const email = parsedEmail.ok ? parsedEmail.data.email : null;
  const preserved = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const item = first(value);
    if (item) {
      preserved.set(key, item);
    }
  }
  const suffix = preserved.size > 0 ? `?${preserved.toString()}` : "";
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
      englishHref={`/en/forgot-password${suffix}`}
      arabicHref={`/ar/forgot-password${suffix}`}
      panelTitle={dict.auth.recoverTitle}
      panelBody={dict.auth.recoverBody}
      showIntro={false}
    >
      {hasPublicSupabaseEnv() || sent ? null : <Notice tone="error">{dict.messages.unconfigured}</Notice>}
      <ForgotPasswordForm locale={locale} copy={dict} sent={sent} email={email} />
    </LoginScreen>
  );
}
