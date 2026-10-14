import { LockOpen } from "lucide-react";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand-lockup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

import { LanguageSelect } from "./language-select";

type ResetPasswordScreenProps = {
  locale: Locale;
  copy: Dictionary;
  brand: string;
  logoUrl: string | null;
  englishHref: string;
  arabicHref: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function ResetPasswordScreen({
  locale,
  copy,
  brand,
  logoUrl,
  englishHref,
  arabicHref,
  title,
  description,
  children,
}: ResetPasswordScreenProps) {
  return (
    <main data-auth="" className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#F3F7FC] px-4 py-8 text-[#0B1736] dark:bg-background dark:text-foreground sm:px-6">
      <div className="pointer-events-none absolute -start-16 top-16 size-64 rounded-full bg-[#ffe4d4]/80 blur-2xl dark:bg-[#ff5722]/10" />
      <div className="pointer-events-none absolute -end-10 bottom-10 size-72 rounded-full bg-[#ffd8c4]/70 blur-2xl dark:bg-[#ff5722]/10" />
      <section className="relative w-full max-w-[40rem] rounded-[28px] border border-[#DCE5F1] bg-white px-5 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10 sm:py-10 dark:border-line dark:bg-surface dark:shadow-[var(--shadow-card)]">
        <div className="flex justify-end">
          <LanguageSelect locale={locale} label={copy.auth.language} englishHref={englishHref} arabicHref={arabicHref} />
        </div>
        <div className="mt-2 flex flex-col items-center text-center">
          <BrandLockup name={brand} logoUrl={logoUrl} />
          <span className="mt-6 inline-flex size-16 items-center justify-center rounded-full bg-[#fff1ea] text-[#FF5722] dark:bg-[#ff5722]/15">
            <LockOpen className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#64748B] dark:text-muted">{description}</p>
        </div>
        <div className="mx-auto mt-8 w-full max-w-lg">{children}</div>
      </section>
    </main>
  );
}
