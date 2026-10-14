import { weekDays, type WeekDay } from "@/lib/businesses/schema";
import type { Locale } from "@/lib/i18n/locales";
import { currencyExponent, formatMinor } from "@/lib/menus/money";
import { localizedText, type PublicMenu } from "@/lib/menus/public-menu";

const schemaDays: Record<WeekDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const businessTypes = {
  restaurant: "Restaurant",
  cafe: "CafeOrCoffeeShop",
  bakery: "Bakery",
} as const;

/**
 * Schema.org payload built only from values the menu already stores.
 * A layout theme is not treated as the business type.
 */
export function menuStructuredData(menu: PublicMenu, locale: Locale, canonicalUrl: string | null): Record<string, unknown> | null {
  const name = menu.name.trim();
  if (!name) {
    return null;
  }

  const sections: Record<string, unknown>[] = [];
  for (const category of menu.categories) {
    const sectionName = localizedText(locale, category.name, category.nameAr).trim();
    const items = category.products
      .map((product) => menuItem(product, menu.currency, locale))
      .filter((item): item is Record<string, unknown> => item !== null);
    if (sectionName && items.length > 0) {
      sections.push({
        "@type": "MenuSection",
        name: sectionName,
        hasMenuItem: items,
      });
    }
  }

  const menuNode: Record<string, unknown> = {
    "@type": "Menu",
    name,
    inLanguage: locale,
  };
  const description = menu.description?.trim();
  if (description) {
    menuNode.description = description;
  }
  if (sections.length > 0) {
    menuNode.hasMenuSection = sections;
  }

  const specific = menu.businessType === "other" ? null : businessTypes[menu.businessType];
  const payload: Record<string, unknown> = specific
    ? {
        "@context": "https://schema.org",
        "@type": specific,
        name,
        hasMenu: menuNode,
      }
    : {
        "@context": "https://schema.org",
        ...menuNode,
      };

  if (description && specific) {
    payload.description = description;
  }
  if (canonicalUrl) {
    payload.url = canonicalUrl;
  }

  const image = absoluteUrl(menu.coverUrl) ?? absoluteUrl(menu.logoUrl);
  if (image) {
    payload.image = image;
  }
  if (menu.phone) {
    payload.telephone = menu.phone;
  }
  const street = menu.address?.trim();
  if (street) {
    payload.address = { "@type": "PostalAddress", streetAddress: street };
  }
  if (menu.mapUrl) {
    payload.hasMap = menu.mapUrl;
  }

  const sameAs = Object.values(menu.socialLinks).filter((link): link is string => Boolean(link));
  if (sameAs.length > 0) {
    payload.sameAs = sameAs;
  }

  const hours = weekDays.flatMap((day) => {
    const entry = menu.hours[day];
    if (!entry || entry.closed || !timeValue(entry.opens) || !timeValue(entry.closes) || entry.opens >= entry.closes) {
      return [];
    }

    return [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: schemaDays[day],
      opens: entry.opens,
      closes: entry.closes,
    }];
  });
  if (hours.length > 0) {
    payload.openingHoursSpecification = hours;
  }

  return payload;
}

export function menuJsonLd(menu: PublicMenu, locale: Locale, canonicalUrl: string | null): string | null {
  const payload = menuStructuredData(menu, locale, canonicalUrl);
  return payload ? JSON.stringify(payload).replaceAll("<", "\\u003c") : null;
}

function menuItem(
  product: PublicMenu["categories"][number]["products"][number],
  currency: string,
  locale: Locale,
): Record<string, unknown> | null {
  const name = localizedText(locale, product.name, product.nameAr).trim();
  if (!name) {
    return null;
  }

  const item: Record<string, unknown> = { "@type": "MenuItem", name };
  const description = localizedText(locale, product.description ?? "", product.descriptionAr).trim();
  if (description) {
    item.description = description;
  }

  const exponent = currencyExponent(currency);
  const price = exponent === null ? "" : formatMinor(product.priceMinor, exponent);
  if (price) {
    item.offers = {
      "@type": "Offer",
      priceCurrency: currency,
      price,
      availability: product.unavailable ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    };
  }

  return item;
}

function absoluteUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function timeValue(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
