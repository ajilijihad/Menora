import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ResetPasswordScreen } from "@/components/auth/reset-password-screen";
import { LoadingState } from "@/components/states/loading-state";
import { canResetPassword } from "@/lib/auth/access";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { localizedText } from "@/lib/homepage/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAuthenticatedUser } from "@/modules/auth";
import { loadHomepage } from "@/modules/homepage/queries";

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).auth.resetTitle };
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <Suspense
      fallback={
        <main data-auth="" className="flex min-h-dvh flex-1 flex-col justify-center bg-[#F3F7FC]">
          <LoadingState label={dict.states.loading} />
        </main>
      }
    >
      <ResetPasswordContent locale={locale} />
    </Suspense>
  );
}

async function ResetPasswordContent({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const user = await getAuthenticatedUser();
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

  const screen = {
    locale,
    copy: dict,
    brand,
    logoUrl,
    englishHref: "/en/reset-password",
    arabicHref: "/ar/reset-password",
    title: dict.auth.resetTitle,
  };

  if (!canResetPassword(Boolean(user))) {
    return (
      <ResetPasswordScreen {...screen} description={dict.messages.session_expired}>
        <div className="flex flex-col items-center gap-4">
          <Link href={`/${locale}/forgot-password`} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff7043] to-[#ff5722] text-sm font-semibold text-white hover:from-[#ff5722] hover:to-[#f0441e]">
            {dict.auth.forgotLink}
          </Link>
          <Link href={`/${locale}/login`} className="text-sm font-semibold text-[#FF5722] hover:text-[#f0441e]">
            {dict.auth.backToLogin}
          </Link>
        </div>
      </ResetPasswordScreen>
    );
  }

  return (
    <ResetPasswordScreen {...screen} description={dict.auth.resetDescription}>
      <ResetPasswordForm locale={locale} copy={dict} />
    </ResetPasswordScreen>
  );
}
