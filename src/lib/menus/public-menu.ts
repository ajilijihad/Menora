import { isSafeMediaPath } from "@/lib/businesses/media";
import {
  businessTypes,
  parseOpeningHours,
  parseSocialLinks,
  socialNetworks,
  weekDays,
  type BusinessType,
  type OpeningHours,
  type SocialLinks,
  type SocialNetwork,
  type WeekDay,
} from "@/lib/businesses/schema";
import { isPublicSlug } from "@/lib/businesses/slug";
import type { Locale } from "@/lib/i18n/locales";

import { appearanceFromRow, menuThemes, normalizeMenuTheme, type MenuAppearance, type MenuTheme } from "./appearance";
import { parseCategoryIcon, type CategoryIcon } from "./category-icons";
import { isSafeCategoryImagePath, isSafeMenuImagePath, menuImageUrl } from "./media";
import { dietaryLabels, type DietaryLabel } from "./schema";
import { currencyExponent, formatMinor } from "./money";

export { menuThemes, type MenuTheme };

export type PublicOption = {
  id: string;
  name: string;
  nameAr: string | null;
  priceMinor: number;
  priceLabel: string;
};

export type PublicProduct = {
  id: string;
  categoryId: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  priceMinor: number;
  compareMinor: number | null;
  priceLabel: string;
  compareAtLabel: string | null;
  imageUrls: string[];
  unavailable: boolean;
  featured: boolean;
  labels: DietaryLabel[];
  variants: PublicOption[];
  addons: PublicOption[];
};

export type PublicCategory = {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  icon: CategoryIcon | null;
  imageUrl: string | null;
  products: PublicProduct[];
};

export type PublicMenu = {
  slug: string;
  name: string;
  businessType: BusinessType;
  description: string | null;
  currency: string;
  theme: MenuTheme;
  appearance: MenuAppearance;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  address: string | null;
  mapUrl: string | null;
  hours: OpeningHours;
  socialLinks: SocialLinks;
  defaultLanguage: "en" | "ar";
  categories: PublicCategory[];
  featured: PublicProduct[];
};

export function publicMenuTag(slug: string) {
  return `public-menu-v3:${slug}`;
}

export function parseMenuTheme(value: unknown): MenuTheme | null {
  return normalizeMenuTheme(value);
}

export function resolveMenuTheme(stored: string | null | undefined, businessType: string): MenuTheme {
  const chosen = parseMenuTheme(stored);
  if (chosen) {
    return chosen;
  }

  if (businessType === "cafe") {
    return "clean-light";
  }

  if (businessType === "bakery") {
    return "traditional-beige";
  }

  if (businessType === "other") {
    return "fresh-green";
  }

  return "modern-dark";
}

export function localizedText(locale: Locale, english: string, arabic: string | null): string {
  if (locale === "ar") {
    const arabicText = arabic?.trim() ?? "";
    return arabicText.length > 0 ? arabicText : english;
  }

  return english;
}

export function secondaryText(locale: Locale, english: string, arabic: string | null): string | null {
  const primary = localizedText(locale, english, arabic);
  const other = locale === "ar" ? english : arabic?.trim() ?? "";
  if (!other || other === primary) {
    return null;
  }

  return other;
}

export function filterPublicMenu(menu: PublicMenu, query: string): PublicMenu {
  const term = query.trim().toLocaleLowerCase();
  if (!term) {
    return menu;
  }

  const categories = menu.categories
    .map((category) => ({
      ...category,
      products: category.products.filter((product) => matchesProduct(product, category, term)),
    }))
    .filter((category) => category.products.length > 0);
  const visible = new Set(categories.flatMap((category) => category.products.map((product) => product.id)));

  return {
    ...menu,
    categories,
    featured: menu.featured.filter((product) => visible.has(product.id)),
  };
}

function matchesProduct(product: PublicProduct, category: PublicCategory, term: string): boolean {
  return [
    product.name,
    product.nameAr,
    product.description,
    product.descriptionAr,
    category.name,
    category.nameAr,
    ...product.labels,
    ...product.variants.flatMap((option) => [option.name, option.nameAr]),
    ...product.addons.flatMap((option) => [option.name, option.nameAr]),
  ].some((value) => value?.toLocaleLowerCase().includes(term));
}

const phonePattern = /^\+?[0-9][0-9 ()-]{6,31}$/;

export function phoneHref(phone: string | null): string | null {
  if (!phone || !phonePattern.test(phone)) {
    return null;
  }

  const digits = phone.replace(/[^\d+]/g, "");
  return digits.length > 0 ? `tel:${digits}` : null;
}

type BusinessSource = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  currency?: unknown;
  business_type?: unknown;
  logo_path?: unknown;
  cover_path?: unknown;
  phone?: unknown;
  address?: unknown;
  map_url?: unknown;
  opening_hours?: unknown;
  social_links?: unknown;
  default_language?: unknown;
};

type CategorySource = {
  id?: unknown;
  name?: unknown;
  name_ar?: unknown;
  description?: unknown;
  description_ar?: unknown;
  icon?: unknown;
  image_path?: unknown;
  sort_order?: unknown;
};

type ProductSource = {
  id?: unknown;
  category_id?: unknown;
  name?: unknown;
  name_ar?: unknown;
  description?: unknown;
  description_ar?: unknown;
  price_cents?: unknown;
  compare_at_cents?: unknown;
  stock_status?: unknown;
  is_featured?: unknown;
  dietary_labels?: unknown;
  sort_order?: unknown;
};

type OptionSource = {
  id?: unknown;
  product_id?: unknown;
  name?: unknown;
  name_ar?: unknown;
  price_cents?: unknown;
  sort_order?: unknown;
};

type ImageSource = {
  product_id?: unknown;
  image_path?: unknown;
  sort_order?: unknown;
};

type SortableCategory = PublicCategory & { sortOrder: number };
type SortableProduct = PublicProduct & { sortOrder: number };

export function assemblePublicMenu(input: {
  businessId: string;
  business: BusinessSource;
  theme: string | null;
  themeSettings?: Parameters<typeof appearanceFromRow>[1];
  supabaseUrl: string;
  categories: CategorySource[];
  products: ProductSource[];
  variants: OptionSource[];
  addons: OptionSource[];
  images: ImageSource[];
}): PublicMenu | null {
  const slug = typeof input.business.slug === "string" ? input.business.slug : "";
  const name = typeof input.business.name === "string" ? input.business.name.trim() : "";
  if (!isPublicSlug(slug) || name.length === 0 || !textId(input.businessId)) {
    return null;
  }

  const currency = typeof input.business.currency === "string" ? input.business.currency : "";
  const exponent = currencyExponent(currency);
  if (exponent === null) {
    return null;
  }

  const rawType = typeof input.business.business_type === "string" ? input.business.business_type : "other";
  const businessType: BusinessType = businessTypes.find((type) => type === rawType) ?? "other";
  const categories = input.categories
    .map((category) => toCategory(category, input.supabaseUrl, input.businessId))
    .filter((category): category is SortableCategory => category !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const categoryIds = new Set(categories.map((category) => category.id));
  const variantsByProduct = groupOptions(input.variants, exponent);
  const addonsByProduct = groupOptions(input.addons, exponent);
  const imagesByProduct = groupImages(input.images, input.supabaseUrl, input.businessId);

  const products = input.products
    .map((product) =>
      toProduct(product, exponent, currency, categoryIds, variantsByProduct, addonsByProduct, imagesByProduct),
    )
    .filter((product): product is SortableProduct => product !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const withProducts = categories
    .map((category) => ({
      ...category,
      products: products.filter((product) => product.categoryId === category.id),
    }))
    .filter((category) => category.products.length > 0);

  const featured = products.filter((product) => product.featured);
  const storedTheme = typeof input.themeSettings?.menu_theme === "string" ? input.themeSettings.menu_theme : input.theme;
  const theme = resolveMenuTheme(storedTheme, businessType);
  const appearance = appearanceFromRow(theme, { ...(input.themeSettings ?? {}), menu_theme: theme });

  return {
    slug,
    name,
    businessType,
    description: optionalText(input.business.description),
    currency,
    theme: appearance.theme,
    appearance,
    logoUrl: mediaUrl(input.supabaseUrl, input.business.logo_path, "logo"),
    coverUrl: mediaUrl(input.supabaseUrl, input.business.cover_path, "cover"),
    phone: optionalPhone(input.business.phone),
    address: optionalText(input.business.address),
    mapUrl: optionalHttps(input.business.map_url),
    hours: parseOpeningHours(input.business.opening_hours),
    socialLinks: parseSocialLinks(input.business.social_links),
    defaultLanguage: input.business.default_language === "ar" ? "ar" : "en",
    categories: withProducts.map(stripSort),
    featured: featured.map(stripProductSort),
  };
}

function toCategory(source: CategorySource, supabaseUrl: string, businessId: string): SortableCategory | null {
  const id = textId(source.id);
  const name = typeof source.name === "string" ? source.name.trim() : "";
  if (!id || name.length === 0) {
    return null;
  }

  const imagePath = typeof source.image_path === "string" ? source.image_path : null;
  const imageUrl =
    imagePath && isSafeCategoryImagePath(businessId, id, imagePath)
      ? menuImageUrl(supabaseUrl, imagePath)
      : null;

  return {
    id,
    name,
    nameAr: optionalText(source.name_ar),
    description: optionalText(source.description),
    descriptionAr: optionalText(source.description_ar),
    icon: imageUrl ? null : parseCategoryIcon(source.icon),
    imageUrl,
    products: [],
    sortOrder: numberOrZero(source.sort_order),
  };
}

function toProduct(
  source: ProductSource,
  exponent: number,
  currency: string,
  categoryIds: Set<string>,
  variantsByProduct: Map<string, PublicOption[]>,
  addonsByProduct: Map<string, PublicOption[]>,
  imagesByProduct: Map<string, string[]>,
): SortableProduct | null {
  const id = textId(source.id);
  const categoryId = textId(source.category_id);
  const name = typeof source.name === "string" ? source.name.trim() : "";
  const price = integer(source.price_cents);
  if (!id || !categoryId || !categoryIds.has(categoryId) || name.length === 0 || price === null) {
    return null;
  }

  const priceLabel = moneyLabel(price, exponent, currency);
  if (!priceLabel) {
    return null;
  }

  const compare = integer(source.compare_at_cents);
  const compareAtLabel =
    compare !== null && compare > price ? moneyLabel(compare, exponent, currency) : null;

  return {
    id,
    categoryId,
    name,
    nameAr: optionalText(source.name_ar),
    description: optionalText(source.description),
    descriptionAr: optionalText(source.description_ar),
    priceMinor: price,
    compareMinor: compare !== null && compare > price ? compare : null,
    priceLabel,
    compareAtLabel,
    imageUrls: imagesByProduct.get(id) ?? [],
    unavailable: source.stock_status === "out_of_stock",
    featured: source.is_featured === true,
    labels: labelsFrom(source.dietary_labels),
    variants: variantsByProduct.get(id) ?? [],
    addons: addonsByProduct.get(id) ?? [],
    sortOrder: numberOrZero(source.sort_order),
  };
}

function groupOptions(rows: OptionSource[], exponent: number): Map<string, PublicOption[]> {
  const grouped = new Map<string, Array<PublicOption & { sortOrder: number }>>();
  for (const row of rows) {
    const productId = textId(row.product_id);
    const id = textId(row.id);
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const price = integer(row.price_cents);
    if (!productId || !id || name.length === 0 || price === null) {
      continue;
    }

    const priceLabel = formatMinor(price, exponent);
    if (!priceLabel) {
      continue;
    }

    const list = grouped.get(productId) ?? [];
    list.push({
      id,
      name,
      nameAr: optionalText(row.name_ar),
      priceMinor: price,
      priceLabel,
      sortOrder: numberOrZero(row.sort_order),
    });
    grouped.set(productId, list);
  }

  const result = new Map<string, PublicOption[]>();
  for (const [productId, list] of grouped) {
    result.set(
      productId,
      list.sort((left, right) => left.sortOrder - right.sortOrder).map(({ sortOrder: _sort, ...option }) => option),
    );
  }

  return result;
}

function groupImages(rows: ImageSource[], supabaseUrl: string, businessId: string | null): Map<string, string[]> {
  const grouped = new Map<string, Array<{ url: string; sortOrder: number }>>();
  for (const row of rows) {
    const productId = textId(row.product_id);
    const path = typeof row.image_path === "string" ? row.image_path : "";
    if (!productId || !businessId || !isSafeMenuImagePath(businessId, productId, path)) {
      continue;
    }

    const list = grouped.get(productId) ?? [];
    list.push({
      url: `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/menu-media/${path}`,
      sortOrder: numberOrZero(row.sort_order),
    });
    grouped.set(productId, list);
  }

  const result = new Map<string, string[]>();
  for (const [productId, list] of grouped) {
    result.set(
      productId,
      list.sort((left, right) => left.sortOrder - right.sortOrder).map((image) => image.url),
    );
  }

  return result;
}

function mediaUrl(supabaseUrl: string, path: unknown, kind: "logo" | "cover"): string | null {
  if (typeof path !== "string") {
    return null;
  }

  const businessId = path.split("/")[0] ?? "";
  if (!isSafeMediaPath(businessId, path, kind)) {
    return null;
  }

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/business-media/${path}`;
}

function moneyLabel(amount: number, exponent: number, currency: string): string | null {
  const formatted = formatMinor(amount, exponent);
  return formatted ? `${formatted} ${currency}` : null;
}

function labelsFrom(value: unknown): DietaryLabel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return dietaryLabels.filter((label) => value.includes(label));
}

function stripSort(category: SortableCategory): PublicCategory {
  const { sortOrder: _sort, ...rest } = category;
  return rest;
}

function stripProductSort(product: SortableProduct): PublicProduct {
  const { sortOrder: _sort, ...rest } = product;
  return rest;
}

function textId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalPhone(value: unknown): string | null {
  const phone = optionalText(value);
  return phone && phonePattern.test(phone) ? phone : null;
}

function optionalHttps(value: unknown): string | null {
  const url = optionalText(value);
  if (!url || !url.startsWith("https://") || url.length > 500) {
    return null;
  }

  return url;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function hasOpenHours(hours: OpeningHours): boolean {
  return weekDays.some((day) => !hours[day].closed);
}

export function orderedDays(): readonly WeekDay[] {
  return weekDays;
}

export function orderedSocials(): readonly SocialNetwork[] {
  return socialNetworks;
}

export function menuHasContent(menu: PublicMenu): boolean {
  return menu.categories.some((category) => category.products.length > 0);
}
