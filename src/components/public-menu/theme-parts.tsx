"use client";

import { Beef, Coffee, Croissant, CupSoda, Drumstick, Flame, Menu, Salad, Sandwich, Soup, UtensilsCrossed, X } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

import {
  ContactLinks,
  HoursList,
  LabelList,
  OptionList,
  PricePair,
  productDescription,
  productName,
  productSecondary,
} from "@/components/public-menu/menu-details";
import { MenuImage } from "@/components/public-menu/menu-image";
import type { PublicMenuCopy } from "@/lib/i18n/public-menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import { appearanceStyle, type MenuAppearance } from "@/lib/menus/appearance";
import { menuHasContent, type PublicCategory, type PublicMenu, type PublicProduct } from "@/lib/menus/public-menu";

export function themeStyle(appearance: MenuAppearance, scheme: "light" | "dark"): CSSProperties {
  return {
    ...appearanceStyle(appearance),
    fontFamily:
      appearance.font === "serif"
        ? 'Georgia, "Times New Roman", var(--font-plex), var(--font-noto-arabic), serif'
        : "var(--font-plex), var(--font-geist-sans), var(--font-noto-arabic), sans-serif",
    colorScheme: scheme,
  };
}

export type ThemeProps = {
  menu: PublicMenu;
  locale: Locale;
  copy: PublicMenuCopy;
  query: string;
  search: ReactNode;
  language: ReactNode;
};

const categoryIcons = [Flame, UtensilsCrossed, Sandwich, Drumstick, Salad, Coffee, CupSoda, Croissant, Soup, Beef];

export function categoryIcon(index: number) {
  return categoryIcons[index % categoryIcons.length] ?? UtensilsCrossed;
}

export function heroSource(menu: PublicMenu): string | null {
  if (menu.coverUrl) {
    return menu.coverUrl;
  }

  for (const category of menu.categories) {
    const photo = category.products.find((product) => product.imageUrls[0])?.imageUrls[0];
    if (photo) {
      return photo;
    }
  }

  return null;
}

export function MenuDrawer({
  copy,
  menu,
  locale,
  search,
  buttonClassName,
}: {
  copy: PublicMenuCopy;
  menu: PublicMenu;
  locale: Locale;
  search: ReactNode;
  buttonClassName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={buttonClassName} aria-expanded={open} aria-label={copy.openMenu} onClick={() => setOpen(true)}>
        <Menu className="size-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-black/55" aria-label={copy.closeMenu} onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-[min(100%,20rem)] flex-col gap-6 overflow-y-auto bg-[var(--menu-bg)] p-5 text-[var(--menu-text)] shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{menu.name}</p>
              <button type="button" aria-label={copy.closeMenu} onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full border border-current/20">
                <X className="size-4" />
              </button>
            </div>
            {search}
            <HoursList menu={menu} copy={copy} locale={locale} className="mt-2 grid gap-1 text-sm" itemClassName="flex justify-between gap-3" />
            <ContactLinks menu={menu} copy={copy} className="grid gap-2 text-sm" linkClassName="underline-offset-4 hover:underline" />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CategoryScroller({
  categories,
  locale,
  copy,
  className,
  itemClassName,
}: {
  categories: PublicCategory[];
  locale: Locale;
  copy: PublicMenuCopy;
  className: string;
  itemClassName: (active: boolean) => string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const activeId = categories.some((category) => category.id === picked) ? picked : categories[0]?.id ?? "";
  if (categories.length === 0) {
    return null;
  }

  return (
    <nav aria-label={copy.categories} className={className}>
      <ul className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        {categories.map((category, index) => {
          const Icon = categoryIcon(index);
          const active = activeId === category.id;
          return (
            <li key={category.id} className="shrink-0">
              <a href={`#category-${category.id}`} className={itemClassName(active)} onClick={() => setPicked(category.id)}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span dir="auto">{productName(locale, category)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ProductPhoto({ src, alt, className }: { src: string | null; alt: string; className: string }) {
  if (!src) {
    return <div aria-hidden="true" className={`${className} bg-[color-mix(in_srgb,currentColor_12%,transparent)]`} />;
  }

  return <MenuImage src={src} alt={alt} width={720} height={540} className={`${className} object-cover`} />;
}

export function DishCopy({
  product,
  locale,
  copy,
  currency,
  priceClassName,
}: {
  product: PublicProduct;
  locale: Locale;
  copy: PublicMenuCopy;
  currency: string;
  priceClassName: string;
}) {
  const description = productDescription(locale, product);
  const secondary = productSecondary(locale, product);

  return (
    <div className="min-w-0 flex-1">
      <h3 dir="auto" className="font-semibold leading-5">{productName(locale, product)}</h3>
      {secondary ? <p dir="auto" className="text-xs opacity-60">{secondary}</p> : null}
      {description ? <p dir="auto" className="mt-1 line-clamp-2 text-xs leading-5 opacity-70">{description}</p> : null}
      <LabelList labels={product.labels} copy={copy} className="mt-1 flex flex-wrap gap-1 text-[10px] tracking-wide opacity-70" />
      {product.unavailable ? <p className="mt-1 text-xs font-medium">{copy.soldOut}</p> : null}
      <OptionList label={copy.variants} options={product.variants} locale={locale} currency={currency} className="mt-1 text-xs opacity-80" />
      <OptionList label={copy.addons} options={product.addons} locale={locale} currency={currency} className="mt-1 text-xs opacity-80" />
      <PricePair product={product} copy={copy} locale={locale} currency={currency} className={priceClassName} compareClassName="me-2 text-xs line-through opacity-50" />
    </div>
  );
}

export function MenuStatus({ menu, copy, query }: { menu: PublicMenu; copy: PublicMenuCopy; query: string }) {
  if (query && menu.categories.length === 0) {
    return <p className="px-4 py-8 text-center text-sm opacity-75 sm:px-6">{copy.noMatches}</p>;
  }

  if (!menuHasContent(menu)) {
    return (
      <div className="px-4 py-10 text-center sm:px-6">
        <h2 className="text-lg font-semibold">{copy.emptyTitle}</h2>
        <p className="mt-2 text-sm opacity-75">{copy.emptyDescription}</p>
      </div>
    );
  }

  return null;
}

export function BrandMark({ menu, className, imageClassName }: { menu: PublicMenu; className: string; imageClassName: string }) {
  return (
    <div className={className}>
      {menu.logoUrl ? (
        <MenuImage src={menu.logoUrl} alt="" width={64} height={64} className={imageClassName} priority />
      ) : (
        <span className={`${imageClassName} grid place-items-center text-sm font-semibold`}>{menu.name.slice(0, 1)}</span>
      )}
      <div className="min-w-0">
        <p dir="auto" className="truncate text-sm font-semibold tracking-wide">{menu.name}</p>
      </div>
    </div>
  );
}
