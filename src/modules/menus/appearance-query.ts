import "server-only";

import { getPublicEnv } from "@/lib/env/public";
import type { BusinessRecord } from "@/lib/businesses/record";
import { appearanceFromRow, type MenuAppearance } from "@/lib/menus/appearance";
import { assemblePublicMenu, resolveMenuTheme, type PublicMenu } from "@/lib/menus/public-menu";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { businessCurrency } from "./queries";

const themeColumns =
  "menu_theme, primary_color, accent_color, background_color, text_color, font_choice, type_scale, card_layout, image_ratio, radius_px, spacing_step, nav_style, featured_style";
const categoryColumns = "id, name, name_ar, description, description_ar, sort_order";
const productColumns =
  "id, category_id, name, name_ar, description, description_ar, price_cents, compare_at_cents, stock_status, is_featured, dietary_labels, sort_order";
const optionColumns = "id, product_id, name, name_ar, price_cents, sort_order";
const imageColumns = "product_id, image_path, sort_order";

export async function loadAppearancePreview(business: BusinessRecord): Promise<{
  appearance: MenuAppearance;
  menu: PublicMenu;
}> {
  const supabase = await createServerSupabaseClient();
  const currency = await businessCurrency(business.id);
  const [themeResult, categoriesResult, productsResult, variantsResult, addonsResult, imagesResult] =
    await Promise.all([
      supabase.from("business_theme_settings").select(themeColumns).eq("business_id", business.id).maybeSingle(),
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
      supabase.from("product_variants").select(optionColumns).eq("business_id", business.id).eq("is_active", true).order("sort_order"),
      supabase.from("product_addons").select(optionColumns).eq("business_id", business.id).eq("is_active", true).order("sort_order"),
      supabase.from("product_images").select(imageColumns).eq("business_id", business.id).order("sort_order"),
    ]);

  const failure = [themeResult, categoriesResult, productsResult, variantsResult, addonsResult, imagesResult].find(
    (result) => result.error,
  );
  if (failure?.error) {
    throw failure.error;
  }

  const theme = resolveMenuTheme(themeResult.data?.menu_theme, business.businessType);
  const appearance = appearanceFromRow(theme, themeResult.data);
  const menu = assemblePublicMenu({
    businessId: business.id,
    business: {
      name: business.name,
      slug: business.slug,
      description: business.description,
      currency,
      business_type: business.businessType,
      logo_path: business.logoPath,
      cover_path: business.coverPath,
      phone: business.phone,
      address: business.address,
      map_url: business.mapUrl,
      opening_hours: business.openingHours,
      social_links: business.socialLinks,
    },
    theme,
    themeSettings: themeResult.data,
    supabaseUrl: getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    categories: categoriesResult.data ?? [],
    products: productsResult.data ?? [],
    variants: variantsResult.data ?? [],
    addons: addonsResult.data ?? [],
    images: imagesResult.data ?? [],
  });

  if (!menu) {
    throw new Error("The business menu could not be prepared for preview.");
  }

  return { appearance, menu: { ...menu, appearance } };
}
