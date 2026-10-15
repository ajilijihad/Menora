import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canEditMenu } from "@/lib/businesses/access";

import { buildCategoryImagePath, buildMenuImagePath, isSafeCategoryImagePath, isSafeMenuImagePath } from "./media";
import { formatMinor, minorUnits } from "./money";
import { parseCategoryForm, parseProductForm } from "./schema";

const businessId = "c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1";
const productId = "d2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2";
const categoryId = "d1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1";

describe("menu money", () => {
  it("stores decimal prices as integer minor units", () => {
    assert.equal(minorUnits("10.50", 2), 1050);
    assert.equal(minorUnits("10.10", 2), 1010);
    assert.equal(minorUnits("0.29", 2), 29);
    assert.equal(minorUnits("1.25", 3), 1250);
    assert.equal(minorUnits("500", 0), 500);
    assert.equal(minorUnits("10.505", 2), null);
    assert.equal(minorUnits("10.5e1", 2), null);
    assert.equal(formatMinor(1050, 2), "10.50");
    assert.equal(formatMinor(1250, 3), "1.250");
    assert.equal(formatMinor(500, 0), "500");
  });
});

describe("menu validation", () => {
  it("accepts bilingual products and rejects a compare price that is not higher", () => {
    const parsed = parseProductForm(
      {
        categoryId,
        name: "Espresso",
        nameAr: "إسبريسو",
        description: "Short shot",
        descriptionAr: "جرعة قصيرة",
        price: "4.00",
        compareAt: "5.00",
        isActive: "on",
        isPublished: "on",
        isFeatured: "on",
        label: ["vegan", "spicy"],
        variantId: "",
        variantName: "Large",
        variantNameAr: "كبير",
        variantPrice: "5.50",
        variantActive: "1",
        addonId: "",
        addonName: "Oat milk",
        addonNameAr: "حليب الشوفان",
        addonPrice: "0.75",
        addonActive: "1",
      },
      2,
    );

    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }
    assert.equal(parsed.data.priceCents, 400);
    assert.equal(parsed.data.compareAtCents, 500);
    assert.equal(parsed.data.variants[0]?.priceCents, 550);
    assert.equal(parsed.data.addons[0]?.nameAr, "حليب الشوفان");

    const cheaper = parseProductForm(
      {
        categoryId,
        name: "Espresso",
        nameAr: "إسبريسو",
        price: "4.00",
        compareAt: "4.00",
      },
      2,
    );
    assert.equal(cheaper.ok, false);
    if (!cheaper.ok) {
      assert.equal(cheaper.message, "compare_invalid");
    }
  });

  it("requires an English category name and keeps Arabic text", () => {
    const parsed = parseCategoryForm({
      name: "Coffee",
      nameAr: "القهوة",
      description: "Hot drinks",
      isPublished: "on",
    });
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.data.nameAr, "القهوة");
      assert.equal(parsed.data.isPublished, true);
      assert.equal(parsed.data.isActive, false);
    }

    const missing = parseCategoryForm({ name: "   " });
    assert.equal(missing.ok, false);
  });
});

describe("menu isolation helpers", () => {
  it("keeps gallery paths inside the owning product and allows editors to manage the menu", () => {
    const path = buildMenuImagePath(
      businessId,
      productId,
      "png",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    assert.equal(isSafeMenuImagePath(businessId, productId, path), true);
    assert.equal(
      isSafeMenuImagePath(
        businessId,
        productId,
        `${businessId}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/img-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png`,
      ),
      false,
    );
    const categoryPath = buildCategoryImagePath(
      businessId,
      categoryId,
      "webp",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    assert.equal(isSafeCategoryImagePath(businessId, categoryId, categoryPath), true);
    assert.equal(isSafeCategoryImagePath(businessId, productId, categoryPath), false);
    assert.equal(isSafeCategoryImagePath(businessId, categoryId, `${categoryPath}/../secret.webp`), false);
    assert.equal(canEditMenu("editor"), true);
    assert.equal(canEditMenu("manager"), true);
    assert.equal(canEditMenu("owner"), true);
    assert.equal(canEditMenu(null), false);
  });
});
