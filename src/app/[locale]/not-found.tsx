"use client";

import { usePathname } from "next/navigation";

import { NotFoundState } from "@/components/states/not-found-state";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeFromPathname } from "@/lib/i18n/locales";

export default function NotFound() {
  const locale = localeFromPathname(usePathname()) ?? "en";
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col justify-center">
      <NotFoundState
        title={dict.states.notFoundTitle}
        description={dict.states.notFoundDescription}
        homeHref={`/${locale}`}
        actionLabel={dict.states.backHome}
      />
    </main>
  );
}
