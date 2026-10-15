import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPublicMenuPath, menuLanguageChoice, publicMenuRewritePath } from "@/lib/i18n/locales";

import {
  assemblePublicMenu,
  filterPublicMenu,
  parseMenuTheme,
  resolveMenuTheme,
  type PublicMenu,
} from "./public-menu";

const businessId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const categoryId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const productId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

describe("public menu routing", () => {
  it("keeps the public address at /menu/slug and chooses a locale internally", () => {
    assert.equal(publicMenuRewritePath("/menu/harbor-grill", "ar", null, null), "/ar/menu/harbor-grill");
    assert.equal(publicMenuRewritePath("/menu/harbor-grill", "en", null, "ar"), "/ar/menu/harbor-grill");
    assert.equal(publicMenuRewritePath("/menu/harbor-grill", null, "en", null, "ar"), "/ar/menu/harbor-grill");
    assert.equal(publicMenuRewritePath("/menu/harbor-grill", null, null, "en", "ar"), "/en/menu/harbor-grill");
    assert.equal(publicMenuRewritePath("/en/menu/harbor-grill", null, null, null), null);
    assert.deepEqual(menuLanguageChoice("ar", "en", "en"), { locale: "ar", redirect: false });
    assert.deepEqual(menuLanguageChoice(null, "ar", "en"), { locale: "ar", redirect: true });
    assert.deepEqual(menuLanguageChoice(null, "en", "en"), { locale: "en", redirect: false });
    assert.equal(isPublicMenuPath("/menu/harbor-grill"), true);
    assert.equal(isPublicMenuPath("/en/menu/harbor-grill"), true);
    assert.equal(isPublicMenuPath("/en/menu/Not_A_Slug"), true);
    assert.equal(isPublicMenuPath("/en/dashboard/businesses/x/menu"), false);
  });
});

describe("public menu assembly", () => {
  it("keeps published display fields and drops unsafe images and private keys", () => {
    const menu = assemblePublicMenu({
      businessId,
      business: {
        name: "Harbor Grill",
        slug: "harbor-grill",
        description: "Wood fire",
        currency: "USD",
        business_type: "restaurant",
        phone: "+1 202 555 0147",
        map_url: "javascript:alert(1)",
        opening_hours: { monday: { closed: false, opens: "09:00", closes: "17:00" } },
      },
      theme: "cafe",
      supabaseUrl: "https://example.supabase.co",
      categories: [
        {
          id: categoryId,
          name: "Mains",
          name_ar: "الأطباق",
          icon: "fish",
          image_path: `${businessId}/cat-${categoryId}-eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.jpg`,
          sort_order: 1,
        },
        {
          id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          name: "Dropped",
          icon: "salad",
          image_path: "../secret.jpg",
          sort_order: 2,
        },
      ],
      products: [
        {
          id: productId,
          category_id: categoryId,
          name: "Steak",
          name_ar: "ستيك",
          description: "Aged",
          price_cents: 2400,
          compare_at_cents: 2800,
          stock_status: "out_of_stock",
          is_featured: true,
          dietary_labels: ["gluten", "secret"],
          sort_order: 1,
        },
        {
          id: "abababab-abab-4aba-8aba-abababababab",
          category_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          name: "Salad",
          price_cents: 800,
          stock_status: "in_stock",
          sort_order: 1,
        },
      ],
      variants: [
        {
          id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          product_id: productId,
          name: "Large",
          name_ar: "كبير",
          price_cents: 2800,
          sort_order: 1,
        },
      ],
      addons: [],
      images: [
        {
          product_id: productId,
          image_path: `${businessId}/${productId}/img-eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.jpg`,
          sort_order: 1,
        },
        { product_id: productId, image_path: "../secret.jpg", sort_order: 0 },
      ],
    });

    assert.ok(menu);
    assert.equal(menu.theme, "clean-light");
    assert.equal(menu.mapUrl, null);
    assert.equal(menu.phone, "+1 202 555 0147");
    assert.equal(menu.featured.length, 1);
    assert.equal(menu.featured[0]?.unavailable, true);
    assert.deepEqual(menu.featured[0]?.labels, ["gluten"]);
    assert.equal(menu.featured[0]?.variants.length, 1);
    assert.equal(menu.featured[0]?.imageUrls.length, 1);
    assert.equal(menu.categories[0]?.icon, null);
    assert.equal(menu.categories[0]?.imageUrl?.includes(`/cat-${categoryId}-`), true);
    assert.equal(menu.categories[1]?.icon, "salad");
    assert.equal(menu.categories[1]?.imageUrl, null);
    assert.equal("owner_id" in menu, false);
    assert.equal(JSON.stringify(menu).includes("secret"), false);
  });

  it("resolves a layout from the business type when none is stored", () => {
    assert.equal(resolveMenuTheme(null, "cafe"), "clean-light");
    assert.equal(resolveMenuTheme(null, "bakery"), "traditional-beige");
    assert.equal(resolveMenuTheme("minimal", "restaurant"), "premium-gold");
    assert.equal(parseMenuTheme("delivery"), null);
  });

  it("filters dishes without removing the business profile", () => {
    const menu = sampleMenu();
    const filtered = filterPublicMenu(menu, "salad");
    assert.equal(filtered.name, "Harbor Grill");
    assert.equal(filtered.categories.length, 1);
    assert.equal(filtered.categories[0]?.products.length, 1);
    assert.equal(filtered.featured.length, 0);
    assert.equal(filterPublicMenu(menu, "missing").categories.length, 0);
  });
});

function sampleMenu(): PublicMenu {
  const built = assemblePublicMenu({
    businessId,
    business: { name: "Harbor Grill", slug: "harbor-grill", currency: "JOD", business_type: "restaurant" },
    theme: "restaurant",
    supabaseUrl: "https://example.supabase.co",
    categories: [
      { id: categoryId, name: "Mains", name_ar: "رئيسية", sort_order: 2 },
      { id: "abababab-abab-4aba-8aba-abababababab", name: "Salads", name_ar: "سلطات", sort_order: 1 },
    ],
    products: [
      {
        id: productId,
        category_id: categoryId,
        name: "Steak",
        price_cents: 12500,
        stock_status: "in_stock",
        is_featured: true,
        sort_order: 1,
      },
      {
        id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        category_id: "abababab-abab-4aba-8aba-abababababab",
        name: "Green salad",
        name_ar: "سلطة خضراء",
        price_cents: 3500,
        stock_status: "in_stock",
        sort_order: 1,
      },
    ],
    variants: [],
    addons: [],
    images: [],
  });
  if (!built) {
    throw new Error("sample menu was rejected");
  }

  return built;
}
