"use client";

import { ChevronDown, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";

type LanguageSelectProps = {
  locale: Locale;
  label: string;
  englishHref: string;
  arabicHref: string;
};

export function LanguageSelect({ locale, label, englishHref, arabicHref }: LanguageSelectProps) {
  const router = useRouter();

  return (
    <label className="relative inline-flex h-10 items-center gap-2 rounded-full border border-[#d7e3f0] bg-white px-3 text-sm font-medium text-[#0B1736] dark:border-line dark:bg-surface dark:text-foreground">
      <Globe className="size-4 text-[#5b6b82]" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        defaultValue={locale}
        onChange={(event) => {
          router.push(event.target.value === "ar" ? arabicHref : englishHref);
        }}
        className="appearance-none bg-transparent pe-5 outline-none"
      >
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 size-4 text-[#5b6b82]" aria-hidden="true" />
    </label>
  );
}
