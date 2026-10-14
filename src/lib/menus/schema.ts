import { z } from "zod";

import { parseBusinessId } from "@/lib/businesses/ids";

import { isCurrencyCode, minorUnits, type CurrencyCode } from "./money";

export const dietaryLabels = [
  "vegetarian",
  "vegan",
  "spicy",
  "gluten",
  "dairy",
  "nuts",
  "shellfish",
  "sesame",
] as const;

export type DietaryLabel = (typeof dietaryLabels)[number];

export const menuFilters = ["all", "published", "draft", "out_of_stock", "featured"] as const;
export type MenuFilter = (typeof menuFilters)[number];

export const menuMessageCodes = [
  "name_required",
  "name_too_long",
  "name_ar_required",
  "name_ar_too_long",
  "description_too_long",
  "price_invalid",
  "compare_invalid",
  "category_invalid",
  "labels_invalid",
  "variant_invalid",
  "addon_invalid",
  "currency_invalid",
  "theme_invalid",
  "appearance_invalid",
  "image_type",
  "image_too_large",
  "image_failed",
  "image_limit",
  "forbidden",
  "not_found",
  "save_failed",
  "name_taken",
  "saved",
  "created",
  "deleted",
  "rate_limited",
  "unconfigured",
  "plan_limit",
  "theme_locked",
] as const;

export type MenuMessageCode = (typeof menuMessageCodes)[number];

export type PricedOption = {
  id: string | null;
  name: string;
  nameAr: string | null;
  priceCents: number;
  isActive: boolean;
};

export type CategoryInput = {
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  isActive: boolean;
  isPublished: boolean;
};

export type ProductInput = {
  categoryId: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  priceCents: number;
  compareAtCents: number | null;
  isActive: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  stockStatus: "in_stock" | "out_of_stock";
  dietaryLabels: DietaryLabel[];
  variants: PricedOption[];
  addons: PricedOption[];
};

const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameAr: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable(),
  descriptionAr: z.string().trim().max(2000).nullable(),
  isActive: z.boolean(),
  isPublished: z.boolean(),
});

const optionSchema = z.object({
  id: z.string().nullable(),
  name: z.string().trim().min(1).max(120),
  nameAr: z.string().trim().min(1).max(120).nullable(),
  priceCents: z.number().int().min(0).max(2_000_000_000),
  isActive: z.boolean(),
});

const productSchema = categorySchema.extend({
  categoryId: z.string(),
  description: z.string().trim().max(4000).nullable(),
  descriptionAr: z.string().trim().max(4000).nullable(),
  name: z.string().trim().min(1).max(160),
  nameAr: z.string().trim().min(1).max(160),
  priceCents: z.number().int().min(0).max(2_000_000_000),
  compareAtCents: z.number().int().min(0).max(2_000_000_000).nullable(),
  isFeatured: z.boolean(),
  stockStatus: z.enum(["in_stock", "out_of_stock"]),
  dietaryLabels: z.array(z.enum(dietaryLabels)).max(dietaryLabels.length),
  variants: z.array(optionSchema).max(20),
  addons: z.array(optionSchema).max(30),
});

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const trimmed = text(value);
  return trimmed.length === 0 ? null : trimmed;
}

function checked(source: Record<string, unknown>, name: string): boolean {
  return source[name] === "on" || source[name] === "true" || source[name] === "1";
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

export function readFormLists(formData: FormData): Record<string, unknown> {
  const source: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") {
      continue;
    }
    const existing = source[key];
    if (Array.isArray(existing)) {
      existing.push(value);
    } else if (typeof existing === "string") {
      source[key] = [existing, value];
    } else {
      source[key] = value;
    }
  }
  return source;
}

function options(
  source: Record<string, unknown>,
  prefix: "variant" | "addon",
  exponent: number,
): PricedOption[] | null {
  const names = strings(source[`${prefix}Name`]);
  const arabic = strings(source[`${prefix}NameAr`]);
  const prices = strings(source[`${prefix}Price`]);
  const ids = strings(source[`${prefix}Id`]);
  const active = strings(source[`${prefix}Active`]);
  const length = Math.max(names.length, arabic.length, prices.length, ids.length, active.length);
  if (
    length > 0 &&
    [names, arabic, prices, ids, active].some((list) => list.length !== length)
  ) {
    return null;
  }

  const rows: PricedOption[] = [];
  for (let index = 0; index < length; index += 1) {
    const name = text(names[index]);
    const nameAr = optionalText(arabic[index]);
    const price = text(prices[index]);
    const id = text(ids[index]);
    const isActive = active[index] !== "0";
    if (!name && !nameAr && !price && !id) {
      continue;
    }
    const priceCents = minorUnits(price || "0", exponent);
    const parsedId = id ? parseBusinessId(id) : null;
    if (!name || priceCents === null || (id && !parsedId)) {
      return null;
    }
    rows.push({ id: parsedId, name, nameAr, priceCents, isActive });
  }

  const seen = new Set<string>();
  for (const row of rows) {
    const key = row.name.toLowerCase();
    if (seen.has(key)) {
      return null;
    }
    seen.add(key);
  }

  return rows;
}

export function parseCategoryForm(
  source: Record<string, unknown>,
): { ok: true; data: CategoryInput } | { ok: false; message: MenuMessageCode } {
  const candidate = {
    name: text(source.name),
    nameAr: text(source.nameAr),
    description: optionalText(source.description),
    descriptionAr: optionalText(source.descriptionAr),
    isActive: checked(source, "isActive"),
    isPublished: checked(source, "isPublished"),
  };
  const parsed = categorySchema.safeParse(candidate);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    if (field === "name") {
      return { ok: false, message: candidate.name.length > 120 ? "name_too_long" : "name_required" };
    }
    if (field === "nameAr") {
      return {
        ok: false,
        message: (candidate.nameAr?.length ?? 0) > 120 ? "name_ar_too_long" : "name_ar_required",
      };
    }
    return { ok: false, message: "description_too_long" };
  }
  return { ok: true, data: parsed.data };
}

export function parseProductForm(
  source: Record<string, unknown>,
  exponent: number,
): { ok: true; data: ProductInput } | { ok: false; message: MenuMessageCode } {
  const priceCents = minorUnits(text(source.price), exponent);
  const compareText = text(source.compareAt);
  const compareAtCents = compareText ? minorUnits(compareText, exponent) : null;
  const labels = strings(source.label).filter((label): label is DietaryLabel =>
    dietaryLabels.some((allowed) => allowed === label),
  );
  const variants = options(source, "variant", exponent);
  const addons = options(source, "addon", exponent);
  const categoryId = parseBusinessId(source.categoryId);

  if (priceCents === null) {
    return { ok: false, message: "price_invalid" };
  }
  if (compareText && compareAtCents === null) {
    return { ok: false, message: "compare_invalid" };
  }
  if (compareAtCents !== null && compareAtCents <= priceCents) {
    return { ok: false, message: "compare_invalid" };
  }
  if (!categoryId) {
    return { ok: false, message: "category_invalid" };
  }
  if (strings(source.label).length !== labels.length) {
    return { ok: false, message: "labels_invalid" };
  }
  if (!variants) {
    return { ok: false, message: "variant_invalid" };
  }
  if (!addons) {
    return { ok: false, message: "addon_invalid" };
  }

  const candidate = {
    categoryId,
    name: text(source.name),
    nameAr: text(source.nameAr),
    description: optionalText(source.description),
    descriptionAr: optionalText(source.descriptionAr),
    priceCents,
    compareAtCents,
    isActive: checked(source, "isActive"),
    isPublished: checked(source, "isPublished"),
    isFeatured: checked(source, "isFeatured"),
    stockStatus: source.outOfStock === "on" || source.outOfStock === "1" ? "out_of_stock" : "in_stock",
    dietaryLabels: labels,
    variants,
    addons,
  } as const;

  const parsed = productSchema.safeParse(candidate);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    if (field === "name") {
      return { ok: false, message: candidate.name.length > 160 ? "name_too_long" : "name_required" };
    }
    if (field === "nameAr") {
      return {
        ok: false,
        message: (candidate.nameAr?.length ?? 0) > 160 ? "name_ar_too_long" : "name_ar_required",
      };
    }
    if (field === "variants") return { ok: false, message: "variant_invalid" };
    if (field === "addons") return { ok: false, message: "addon_invalid" };
    if (field === "dietaryLabels") return { ok: false, message: "labels_invalid" };
    if (field.startsWith("description")) return { ok: false, message: "description_too_long" };
    return { ok: false, message: "save_failed" };
  }

  if (parsed.data.compareAtCents !== null && parsed.data.compareAtCents <= parsed.data.priceCents) {
    return { ok: false, message: "compare_invalid" };
  }

  return { ok: true, data: parsed.data };
}

export function parseCurrency(value: unknown): CurrencyCode | null {
  const code = text(value).toUpperCase();
  return isCurrencyCode(code) ? code : null;
}

export function parseMenuFilter(value: unknown): MenuFilter {
  const filter = text(value);
  return menuFilters.find((item) => item === filter) ?? "all";
}

export function parsePage(value: unknown): number {
  const page = Number(text(value) || "1");
  if (!Number.isInteger(page) || page < 1 || page > 10_000) {
    return 1;
  }
  return page;
}

export function searchTerm(value: unknown): string {
  return text(value)
    .slice(0, 80)
    .replace(/[%_,\\]/g, "")
    .trim();
}

export function messageFromMenuQuery(value: string | string[] | undefined): MenuMessageCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return menuMessageCodes.find((code) => code === raw) ?? null;
}
