import assert from "node:assert/strict";
import { describe, it } from "node:test";

import QRCode from "qrcode";

import { canonicalMenuUrl } from "./public-url";

describe("canonical menu URLs", () => {
  it("keeps a production https origin and rejects local or insecure production URLs", () => {
    assert.equal(
      canonicalMenuUrl("harbor-grill", "https://menus.example.com", "production"),
      "https://menus.example.com/menu/harbor-grill",
    );
    assert.equal(canonicalMenuUrl("harbor-grill", "http://menus.example.com", "production"), null);
    assert.equal(canonicalMenuUrl("harbor-grill", "https://localhost:3000", "production"), null);
    assert.equal(canonicalMenuUrl("harbor-grill", "https://127.0.0.1", "production"), null);
    assert.equal(canonicalMenuUrl("harbor-grill", "https://menus.example.com/app", "production"), null);
    assert.equal(canonicalMenuUrl("harbor-grill", "https://menus.example.com/?theme=cafe", "production"), null);
    assert.equal(canonicalMenuUrl("Not A Slug", "https://menus.example.com", "production"), null);
  });

  it("allows a local origin while developing", () => {
    assert.equal(
      canonicalMenuUrl("harbor-grill", "http://localhost:3000", "development"),
      "http://localhost:3000/menu/harbor-grill",
    );
  });

  it("encodes the canonical URL in PNG and SVG without a theme query", async () => {
    const url = canonicalMenuUrl("harbor-grill", "https://menus.example.com", "production");
    assert.ok(url);
    const png = await QRCode.toBuffer(url, { type: "png", width: 1024, margin: 2, errorCorrectionLevel: "M" });
    assert.equal(png[0], 0x89);
    assert.equal(png[1], 0x50);
    const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
    assert.equal(svg.startsWith("<svg"), true);
    assert.equal(svg.includes("</svg>"), true);
    assert.equal(svg.includes("theme="), false);
    assert.equal(svg.includes("<script"), false);
    assert.equal(svg.includes("localhost"), false);
  });
});
