import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { isPublicSlug } from "@/lib/businesses/slug";
import { assemblePublicMenu, publicMenuTag, type PublicMenu } from "@/lib/menus/public-menu";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type PublicMenuResult =
  | { status: "ready"; menu: PublicMenu }
  | { status: "missing" }
  | { status: "unconfigured" };

const categoryColumns = "id, name, name_ar, description, description_ar, icon, image_path, sort_order";
const productColumns =
  "id, category_id, name, name_ar, description, description_ar, price_cents, compare_at_cents, stock_status, is_featured, dietary_labels, sort_order";
const optionColumns = "id, product_id, name, name_ar, price_cents, sort_order";
const imageColumns = "product_id, image_path, sort_order";

export async function resolvePublishedSlug(
  slug: string,
): Promise<{ status: "ready"; slug: string } | { status: "missing" } | { status: "unconfigured" }> {
  if (!isPublicSlug(slug)) {
    return { status: "missing" };
  }

  try {
    getPublicEnv();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return { status: "unconfigured" };
    }

    throw error;
  }

  return loadPublishedSlug(slug);
}

async function loadPublishedSlug(
  slug: string,
): Promise<{ status: "ready"; slug: string } | { status: "missing" }> {
  "use cache";
  cacheLife("minutes");
  cacheTag(publicMenuTag(slug));

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.rpc("published_menu_slug", { target_slug: slug });
  if (error) {
    throw error;
  }

  return data ? { status: "ready", slug: data } : { status: "missing" };
}

export async function getPublishedMenu(slug: string): Promise<PublicMenuResult> {
  if (!isPublicSlug(slug)) {
    return { status: "missing" };
  }

  try {
    getPublicEnv();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return { status: "unconfigured" };
    }

    throw error;
  }

  return loadPublishedMenu(slug);
}

async function loadPublishedMenu(slug: string): Promise<PublicMenuResult> {
  "use cache";
  cacheLife("minutes");
  // Includes the saved public layout, so a theme change must refresh this tag.
  cacheTag(publicMenuTag(slug));

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.rpc("published_business", { target_slug: slug });
  if (error) {
    throw error;
  }

  const business = data?.[0];
  if (!business) {
    return { status: "missing" };
  }

  const [themeResult, categoriesResult, productsResult, variantsResult, addonsResult, imagesResult] =
    await Promise.all([
      supabase
        .from("business_theme_settings")
        .select(
          "menu_theme, primary_color, accent_color, background_color, text_color, font_choice, type_scale, card_layout, image_ratio, radius_px, spacing_step, nav_style, featured_style",
        )
        .eq("business_id", business.id)
        .maybeSingle(),
      supabase
        .from("menu_categories")
        .select(categoryColumns)
        .eq("business_id", business.id)
        .eq("is_active", true)
        .eq("is_published", true)
        .order("sort_order"),
      supabase
        .from("menu_products")
        .select(productColumns)
        .eq("business_id", business.id)
        .eq("is_active", true)
        .eq("is_published", true)
        .order("sort_order"),
      supabase
        .from("product_variants")
        .select(optionColumns)
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("product_addons")
        .select(optionColumns)
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("sort_order"),
      supabase.from("product_images").select(imageColumns).eq("business_id", business.id).order("sort_order"),
    ]);

  const failure = [themeResult, categoriesResult, productsResult, variantsResult, addonsResult, imagesResult].find(
    (result) => result.error,
  );
  if (failure?.error) {
    throw failure.error;
  }

  const storedTheme = typeof themeResult.data?.menu_theme === "string" ? themeResult.data.menu_theme : "modern-dark";
  const entitled = await supabase.rpc("entitled_menu_theme", {
    target_business_id: business.id,
    stored_theme: storedTheme,
  });
  if (entitled.error || !entitled.data) {
    throw entitled.error ?? new Error("menu theme entitlement unavailable");
  }

  const menu = assemblePublicMenu({
    businessId: business.id,
    business,
    theme: entitled.data,
    themeSettings: themeResult.data ? { ...themeResult.data, menu_theme: entitled.data } : null,
    supabaseUrl: getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    categories: categoriesResult.data ?? [],
    products: productsResult.data ?? [],
    variants: variantsResult.data ?? [],
    addons: addonsResult.data ?? [],
    images: imagesResult.data ?? [],
  });

  if (!menu) {
    return { status: "missing" };
  }

  return { status: "ready", menu };
}
