import assert from "node:assert/strict";
import test from "node:test";

import { assemblePublicMenu } from "./public-menu";
import { menuStructuredData } from "./structured-data";

const businessId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

test("structured data uses the business type and only stored values", () => {
  const menu = assemblePublicMenu({
    businessId,
    business: {
      name: "Harbor Grill",
      slug: "harbor-grill",
      currency: "JOD",
      business_type: "restaurant",
      description: "Fish and salad",
      phone: "+962790000000",
      address: "Rainbow Street",
    },
    theme: "cafe",
    supabaseUrl: "https://example.supabase.co",
    categories: [{ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", name: "Mains", sort_order: 1 }],
    products: [{
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      category_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      name: "Steak",
      price_cents: 12500,
      stock_status: "out_of_stock",
      sort_order: 1,
    }],
    variants: [],
    addons: [],
    images: [],
  });
  assert.ok(menu);
  const data = menuStructuredData(menu, "en", "https://menor.example/menu/harbor-grill");
  assert.equal(data?.["@type"], "Restaurant");
  assert.equal(data?.url, "https://menor.example/menu/harbor-grill");
  assert.equal(JSON.stringify(data).includes("aggregateRating"), false);
  assert.equal(JSON.stringify(data).includes("CafeOrCoffeeShop"), false);
  const sections = (data?.hasMenu as { hasMenuSection: { hasMenuItem: { offers: { price: string; availability: string } }[] }[] }).hasMenuSection;
  assert.equal(sections[0]?.hasMenuItem[0]?.offers.price, "12.500");
  assert.equal(sections[0]?.hasMenuItem[0]?.offers.availability, "https://schema.org/OutOfStock");
});

test("other businesses are a menu, not a restaurant", () => {
  const menu = assemblePublicMenu({
    businessId,
    business: { name: "Harbor", slug: "harbor", currency: "USD", business_type: "other" },
    theme: "restaurant",
    supabaseUrl: "https://example.supabase.co",
    categories: [],
    products: [],
    variants: [],
    addons: [],
    images: [],
  });
  assert.ok(menu);
  const data = menuStructuredData(menu, "en", null);
  assert.equal(data?.["@type"], "Menu");
  assert.equal("url" in (data ?? {}), false);
  assert.equal("telephone" in (data ?? {}), false);
  assert.equal("address" in (data ?? {}), false);
});
