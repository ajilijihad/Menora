import "server-only";

import { parseBusinessId } from "@/lib/businesses/ids";
import { parseCategoryIcon, type CategoryIcon } from "@/lib/menus/category-icons";
import { resolveMenuTheme } from "@/lib/menus/public-menu";
import { dietaryLabels, type DietaryLabel, type MenuFilter } from "@/lib/menus/schema";
import { isCurrencyCode, type CurrencyCode } from "@/lib/menus/money";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MenuCategoryRecord = {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  icon: CategoryIcon | null;
  imagePath: string | null;
  sortOrder: number;
  isActive: boolean;
  isPublished: boolean;
};

export type MenuOptionRecord = {
  id: string;
  name: string;
  nameAr: string | null;
  priceCents: number;
  sortOrder: number;
  isActive: boolean;
};

export type MenuImageRecord = {
  id: string;
  path: string;
  sortOrder: number;
};

export type MenuProductRecord = {
  id: string;
  categoryId: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  priceCents: number;
  compareAtCents: number | null;
  imagePath: string | null;
  sortOrder: number;
  isActive: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  stockStatus: "in_stock" | "out_of_stock";
  dietaryLabels: DietaryLabel[];
  images: MenuImageRecord[];
  variants: MenuOptionRecord[];
  addons: MenuOptionRecord[];
};

const pageSize = 10;

function labels(value: unknown): DietaryLabel[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((label): label is DietaryLabel =>
    dietaryLabels.some((allowed) => allowed === label),
  );
}

function categoryFrom(row: {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  icon: string | null;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
  is_published: boolean;
}): MenuCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar,
    icon: parseCategoryIcon(row.icon),
    imagePath: row.image_path,
    description: row.description,
    descriptionAr: row.description_ar,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    isPublished: row.is_published,
  };
}

export async function businessCurrency(businessId: string): Promise<CurrencyCode> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("currency")
    .eq("id", businessId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data && isCurrencyCode(data.currency) ? data.currency : "USD";
}

export async function menuStats(businessId: string, categoryIds: string[]): Promise<{
  products: number;
  published: number;
  byCategory: Map<string, number>;
}> {
  const supabase = await createServerSupabaseClient();
  const [all, published, counts] = await Promise.all([
    supabase.from("menu_products").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("menu_products").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("is_published", true),
    Promise.all(
      categoryIds.map(async (categoryId) => {
        const result = await supabase
          .from("menu_products")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("category_id", categoryId);
        if (result.error) {
          throw result.error;
        }
        return [categoryId, result.count ?? 0] as const;
      }),
    ),
  ]);
  if (all.error) {
    throw all.error;
  }
  if (published.error) {
    throw published.error;
  }

  return {
    products: all.count ?? 0,
    published: published.count ?? 0,
    byCategory: new Map(counts),
  };
}

export async function categoryCoverPaths(businessId: string): Promise<Map<string, string>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("menu_products")
    .select("category_id, image_path")
    .eq("business_id", businessId)
    .not("image_path", "is", null)
    .order("sort_order", { ascending: true });
  if (error) {
    throw error;
  }
  const covers = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.image_path && !covers.has(row.category_id)) {
      covers.set(row.category_id, row.image_path);
    }
  }
  return covers;
}

export async function listCategories(businessId: string): Promise<MenuCategoryRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, name, name_ar, description, description_ar, icon, image_path, sort_order, is_active, is_published")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []).map(categoryFrom);
}

export async function getCategory(
  businessId: string,
  categoryId: string,
): Promise<MenuCategoryRecord | null> {
  const id = parseBusinessId(categoryId);
  if (!id) {
    return null;
  }
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, name, name_ar, description, description_ar, icon, image_path, sort_order, is_active, is_published")
    .eq("business_id", businessId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ? categoryFrom(data) : null;
}

export async function listProducts(
  businessId: string,
  options: { term: string; filter: MenuFilter; categoryId: string | null; page: number },
): Promise<{ products: MenuProductRecord[]; total: number; pageSize: number }> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("menu_products")
    .select(
      "id, category_id, name, name_ar, description, description_ar, price_cents, compare_at_cents, image_path, sort_order, is_active, is_published, is_featured, stock_status, dietary_labels",
      { count: "exact" },
    )
    .eq("business_id", businessId);

  if (options.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }
  if (options.filter === "published") {
    query = query.eq("is_published", true);
  }
  if (options.filter === "draft") {
    query = query.eq("is_published", false);
  }
  if (options.filter === "out_of_stock") {
    query = query.eq("stock_status", "out_of_stock");
  }
  if (options.filter === "featured") {
    query = query.eq("is_featured", true);
  }
  if (options.term) {
    query = query.or(`name.ilike.%${options.term}%,name_ar.ilike.%${options.term}%`);
  }

  const from = (options.page - 1) * pageSize;
  const { data, error, count } = await query
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) {
    throw error;
  }

  return {
    products: (data ?? []).map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      nameAr: row.name_ar,
      description: row.description,
      descriptionAr: row.description_ar,
      priceCents: row.price_cents,
      compareAtCents: row.compare_at_cents,
      imagePath: row.image_path,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      isPublished: row.is_published,
      isFeatured: row.is_featured,
      stockStatus: row.stock_status,
      dietaryLabels: labels(row.dietary_labels),
      images: [],
      variants: [],
      addons: [],
    })),
    total: count ?? 0,
    pageSize,
  };
}

export async function getProduct(
  businessId: string,
  productId: string,
): Promise<MenuProductRecord | null> {
  const id = parseBusinessId(productId);
  if (!id) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("menu_products")
    .select(
      "id, category_id, name, name_ar, description, description_ar, price_cents, compare_at_cents, image_path, sort_order, is_active, is_published, is_featured, stock_status, dietary_labels",
    )
    .eq("business_id", businessId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  const [images, variants, addons] = await Promise.all([
    supabase
      .from("product_images")
      .select("id, image_path, sort_order")
      .eq("business_id", businessId)
      .eq("product_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id, name, name_ar, price_cents, sort_order, is_active")
      .eq("business_id", businessId)
      .eq("product_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_addons")
      .select("id, name, name_ar, price_cents, sort_order, is_active")
      .eq("business_id", businessId)
      .eq("product_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (images.error || variants.error || addons.error) {
    throw images.error ?? variants.error ?? addons.error;
  }

  return {
    id: data.id,
    categoryId: data.category_id,
    name: data.name,
    nameAr: data.name_ar,
    description: data.description,
    descriptionAr: data.description_ar,
    priceCents: data.price_cents,
    compareAtCents: data.compare_at_cents,
    imagePath: data.image_path,
    sortOrder: data.sort_order,
    isActive: data.is_active,
    isPublished: data.is_published,
    isFeatured: data.is_featured,
    stockStatus: data.stock_status,
    dietaryLabels: labels(data.dietary_labels),
    images: (images.data ?? []).map((image) => ({
      id: image.id,
      path: image.image_path,
      sortOrder: image.sort_order,
    })),
    variants: (variants.data ?? []).map(optionFrom),
    addons: (addons.data ?? []).map(optionFrom),
  };
}

export async function getMenuTheme(businessId: string, businessType: string) {
  const id = parseBusinessId(businessId);
  if (!id) {
    return resolveMenuTheme(null, businessType);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("business_theme_settings")
    .select("menu_theme")
    .eq("business_id", id)
    .maybeSingle();
  if (error) {
    throw error;
  }

  return resolveMenuTheme(data?.menu_theme, businessType);
}

function optionFrom(row: {
  id: string;
  name: string;
  name_ar: string | null;
  price_cents: number;
  sort_order: number;
  is_active: boolean;
}): MenuOptionRecord {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar,
    priceCents: row.price_cents,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}
