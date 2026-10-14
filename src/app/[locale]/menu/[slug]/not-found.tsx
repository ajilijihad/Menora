"use client";

import { usePathname } from "next/navigation";

import { NotFoundState } from "@/components/states/not-found-state";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeFromPathname } from "@/lib/i18n/locales";

export default function PublicMenuNotFound() {
  const locale = localeFromPathname(usePathname()) ?? "en";
  const copy = getDictionary(locale).publicMenu;

  return (
    <main data-public-menu className="flex flex-1 flex-col justify-center">
      <style>{`body > header { display: none !important; }`}</style>
      <NotFoundState
        title={copy.notFoundTitle}
        description={copy.notFoundDescription}
        homeHref={`/${locale}`}
        actionLabel={copy.backHome}
      />
    </main>
  );
}
