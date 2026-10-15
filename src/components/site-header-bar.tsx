"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand-lockup";
import { isPublicMenuPath, localeFromPathname, type Locale } from "@/lib/i18n/locales";

type SiteHeaderBarProps = {
  locale: Locale;
  siteName: string;
  logoUrl: string | null;
  languageLabel: string;
  children: ReactNode;
};

export function SiteHeaderBar({ locale, siteName, logoUrl, languageLabel, children }: SiteHeaderBarProps) {
  const pathname = usePathname() || `/${locale}`;
  if (isPublicMenuPath(pathname) || /\/login(?:\/|$)/.test(pathname)) {
    return <header className="hidden" />;
  }

  const targetLocale = locale === "en" ? "ar" : "en";
  const switchedPath = localeFromPathname(pathname)
    ? pathname.replace(/^\/(en|ar)/, `/${targetLocale}`)
    : `/${targetLocale}`;

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3">
        <Link href={`/${locale}`} className="text-sm tracking-tight">
          <BrandLockup name={siteName} logoUrl={logoUrl} />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href={switchedPath}>{languageLabel}</Link>
          {children}
        </nav>
      </div>
    </header>
  );
}
