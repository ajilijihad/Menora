"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";
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
    <Select
      ariaLabel={label}
      value={locale}
      leading={<Globe className="size-4 text-[#5b6b82]" aria-hidden="true" />}
      onValueChange={(next) => {
        router.push(next === "ar" ? arabicHref : englishHref);
      }}
      options={[
        { value: "en", label: "English" },
        { value: "ar", label: "العربية" },
      ]}
      className="h-10 rounded-full border border-[#d7e3f0] bg-white px-3 text-sm font-medium text-[#0B1736] dark:border-line dark:bg-surface dark:text-foreground"
    />
  );
}
