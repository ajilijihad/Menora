import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { LoginScreen } from "@/components/auth/login-screen";
import { Notice } from "@/components/auth/notice";
import { LoadingState } from "@/components/states/loading-state";
import { EnvConfigError } from "@/lib/env/error";
import { hasPublicSupabaseEnv, getPublicEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { localizedText } from "@/lib/homepage/schema";
import { messageFromQuery } from "@/lib/auth/messages";
import { safeNextPath } from "@/lib/auth/paths";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { loadHomepage } from "@/modules/homepage/queries";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).auth.loginTitle };
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
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
      <LoginContent locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function LoginContent({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: LoginPageProps["searchParams"];
}) {
  const query = await searchParams;
  const dict = getDictionary(locale);
  const nextPath = safeNextPath(typeof query.next === "string" ? query.next : null);
  const notice = messageFromQuery(query.error) ?? messageFromQuery(query.notice);
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
      englishHref={`/en/login${suffix}`}
      arabicHref={`/ar/login${suffix}`}
    >
      {hasPublicSupabaseEnv() ? null : <Notice tone="error">{dict.messages.unconfigured}</Notice>}
      <LoginForm locale={locale} copy={dict} nextPath={nextPath} notice={notice} />
    </LoginScreen>
  );
}
