import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  appearanceFromRow,
  appearanceRecord,
  appearanceStyle,
  contrastRatio,
  defaultAppearance,
  parseAppearance,
} from "./appearance";
import { previewMenu, restoredAppearance, withSampleDishes } from "./preview-menu";
import { assemblePublicMenu } from "./public-menu";

const valid = {
  theme: "modern-dark",
  primary: "#112233",
  secondary: "#abcdef",
  background: "#ffffff",
  text: "#111111",
  font: "serif",
  typeScale: "lg",
  cardLayout: "overlay",
  imageRatio: "portrait",
  radius: 12,
  spacing: "compact",
  navStyle: "underline",
  featuredStyle: "grid",
};

describe("theme appearance parsing", () => {
  it("accepts allowlisted values and ignores extra fields", () => {
    const parsed = parseAppearance({ ...valid, css: "body{background:url(javascript:alert(1))}", html: "<script>" });
    assert.deepEqual(parsed, {
      ...valid,
      primary: "#112233",
      secondary: "#abcdef",
    });
    assert.equal(JSON.stringify(appearanceRecord(parsed!)).includes("script"), false);
    assert.equal(JSON.stringify(appearanceRecord(parsed!)).includes("url("), false);
  });

  it("rejects unsafe colors, fonts, markup, and radius values", () => {
    assert.equal(parseAppearance({ ...valid, primary: "red" }), null);
    assert.equal(parseAppearance({ ...valid, text: "#fff;background:url(javascript:alert(1))" }), null);
    assert.equal(parseAppearance({ ...valid, background: "expression(alert(1))" }), null);
    assert.equal(parseAppearance({ ...valid, font: "Arial, sans-serif" }), null);
    assert.equal(parseAppearance({ ...valid, navStyle: "<script>alert(1)</script>" }), null);
    assert.equal(parseAppearance({ ...valid, radius: "16px" }), null);
    assert.equal(parseAppearance({ ...valid, radius: 33 }), null);
    assert.equal(parseAppearance({ ...valid, radius: -1 }), null);
  });

  it("builds CSS variables from the allowlist", () => {
    const style = appearanceStyle(parseAppearance(valid)!);
    assert.equal(style.fontFamily, 'Georgia, "Times New Roman", var(--font-noto-arabic), serif');
    assert.equal(style["--menu-radius" as keyof typeof style], "12px");
    assert.equal(String(style.fontFamily).includes("Arial"), false);
    assert.equal(JSON.stringify(style).includes("url("), false);
    assert.equal(JSON.stringify(style).includes("<"), false);
  });

  it("falls back when a stored token is not safe", () => {
    const appearance = appearanceFromRow("cafe", {
      menu_theme: "cafe",
      primary_color: "#112233",
      text_color: "javascript:alert(1)",
    });
    assert.equal(appearance.theme, "clean-light");
    assert.equal(appearance.primary, defaultAppearance("clean-light").primary);
    assert.equal(JSON.stringify(appearance).includes("javascript"), false);
  });

  it("keeps color edits when the layout changes and restores only tokens", () => {
    const edited = { ...defaultAppearance("modern-dark"), primary: "#123456" };
    const switched = { ...edited, theme: "premium-gold" as const };
    assert.equal(switched.primary, "#123456");
    assert.equal(switched.theme, "premium-gold");
    assert.equal(restoredAppearance(switched.theme).primary, defaultAppearance("premium-gold").primary);
    assert.equal(contrastRatio("#111111", "#ffffff") >= 4.5, true);
  });

  it("shows sample dishes in preview without changing the saved menu", () => {
    const menu = assemblePublicMenu({
      businessId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      business: { name: "Harbor Grill", slug: "harbor-grill", currency: "USD", business_type: "restaurant" },
      theme: "modern-dark",
      supabaseUrl: "https://example.supabase.co",
      categories: [],
      products: [],
      variants: [],
      addons: [],
      images: [],
    });
    assert.ok(menu);
    const preview = withSampleDishes(previewMenu(menu, defaultAppearance("clean-light"), { logoUrl: null, coverUrl: null }), "Samples", "Sample dish");
    assert.equal(menu.categories.length, 0);
    assert.equal(preview.theme, "clean-light");
    assert.equal(preview.categories.length, 1);
    assert.equal(preview.categories[0]?.products[0]?.name, "Sample dish");
  });
});
