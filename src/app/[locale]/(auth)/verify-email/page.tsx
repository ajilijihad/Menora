import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthScreen } from "@/components/auth/auth-screen";
import { Notice } from "@/components/auth/notice";
import { ResendForm } from "@/components/auth/resend-form";
import { textLinkClassName } from "@/components/auth/styles";
import { hasPublicSupabaseEnv } from "@/lib/env/public";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: VerifyEmailPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).auth.verifyTitle };
}

export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <AuthScreen title={dict.auth.verifyTitle} description={dict.messages.check_email}>
      {hasPublicSupabaseEnv() ? null : <Notice tone="error">{dict.messages.unconfigured}</Notice>}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.auth.resendDescription}</p>
      <ResendForm locale={locale} copy={dict} />
      <Link href={`/${locale}/login`} className={textLinkClassName}>
        {dict.auth.backToLogin}
      </Link>
    </AuthScreen>
  );
}
