"use client";

import { usePathname } from "next/navigation";

import { MenuUnavailable } from "@/components/public-menu/menu-unavailable";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeFromPathname } from "@/lib/i18n/locales";

export default function PublicMenuNotFound() {
  const locale = localeFromPathname(usePathname()) ?? "en";
  const dict = getDictionary(locale);
  const copy = dict.publicMenu;

  return (
    <MenuUnavailable
      brand={dict.brand}
      title={copy.notFoundTitle}
      description={copy.notFoundDescription}
      homeHref={`/${locale}`}
      actionLabel={copy.backHome}
    />
  );
}
