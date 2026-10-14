"use client";

import { useMemo, useState } from "react";

import type { PublicMenuCopy } from "@/lib/i18n/public-menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import { filterPublicMenu, type PublicMenu } from "@/lib/menus/public-menu";

import { CleanLightMenu } from "./clean-light-menu";
import { FreshGreenMenu } from "./fresh-green-menu";
import { ModernDarkMenu } from "./modern-dark-menu";
import { PremiumGoldMenu } from "./premium-gold-menu";
import { TraditionalBeigeMenu } from "./traditional-beige-menu";

type MenuViewProps = {
  menu: PublicMenu;
  locale: Locale;
  copy: PublicMenuCopy;
};

export function MenuView({ menu, locale, copy }: MenuViewProps) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterPublicMenu(menu, query), [menu, query]);
  const other = locale === "ar" ? "en" : "ar";
  const search = (
    <div role="search">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{copy.searchLabel}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="h-11 w-full rounded-full border border-current/20 bg-transparent px-4 text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </label>
    </div>
  );
  const language = (
    <a href={`/menu/${menu.slug}?lang=${other}`} className="font-medium underline-offset-4 hover:underline">
      {copy.switchLanguage}
    </a>
  );
  const props = { menu: visible, locale, copy, query: query.trim(), search, language };

  if (menu.theme === "clean-light") {
    return <CleanLightMenu {...props} />;
  }

  if (menu.theme === "premium-gold") {
    return <PremiumGoldMenu {...props} />;
  }

  if (menu.theme === "fresh-green") {
    return <FreshGreenMenu {...props} />;
  }

  if (menu.theme === "traditional-beige") {
    return <TraditionalBeigeMenu {...props} />;
  }

  return <ModernDarkMenu {...props} />;
}
