import assert from "node:assert/strict";
import test from "node:test";

import { posterSvg, qrContrast, qrPaletteFromSearch, qrPresets } from "./qr-palette";
import { paintQrSvg, qrDrawFromSearch } from "./qr-style";

const safeQr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><path d="M0 0"/></svg>`;

test("QR colors require a scannable contrast and ignore unsafe values", () => {
  assert.ok(qrContrast("#000000", "#FFFFFF") > 4.5);
  assert.ok(qrContrast("#FF5A24", "#FFFFFF") < 4.5);
  for (const preset of qrPresets) {
    assert.ok(qrContrast(preset.dark, preset.light) >= 4.5);
  }

  const params = new URLSearchParams("dark=ff5a24&light=ffffff");
  assert.deepEqual(qrPaletteFromSearch(params), { dark: "#000000", light: "#FFFFFF" });
  assert.deepEqual(qrPaletteFromSearch(new URLSearchParams("dark=15213b&light=ffffff")), {
    dark: "#15213B",
    light: "#FFFFFF",
  });
  assert.deepEqual(qrPaletteFromSearch(new URLSearchParams("dark=<script>&light=javascript:")), {
    dark: "#000000",
    light: "#FFFFFF",
  });
});

test("QR styles draw dots, rounded modules, and a safe logo", () => {
  const matrix = {
    size: 21,
    modules: Array.from({ length: 21 * 21 }, (_, index) => index % 3 === 0),
  };
  const dots = paintQrSvg(matrix, { dark: "#000000", light: "#FFFFFF", style: "dots" });
  const rounded = paintQrSvg(matrix, { dark: "#000000", light: "#FFFFFF", style: "rounded" });
  const logo = paintQrSvg(matrix, { dark: "#111111", light: "#FFFFFF", style: "logo", logoHref: "https://cdn.example.com/logo.png" });
  assert.equal(dots?.includes("<circle"), true);
  assert.equal(rounded?.includes('rx="0.28"'), true);
  assert.equal(logo?.includes("https://cdn.example.com/logo.png"), true);
  assert.equal(paintQrSvg(matrix, { dark: "#000000", light: "#FFFFFF", style: "logo", logoHref: "javascript:alert(1)" })?.includes("javascript:"), false);
  assert.deepEqual(qrDrawFromSearch(new URLSearchParams("style=dots&dark=111111&light=ffffff")), {
    dark: "#111111",
    light: "#FFFFFF",
    style: "dots",
  });
  assert.equal(qrDrawFromSearch(new URLSearchParams("style=script")).style, "classic");
});

test("poster SVG keeps the menu URL and escapes the business name", () => {
  const poster = posterSvg(safeQr, `Cafe <script>`, "Scan to view our menu", "https://menus.example.com/menu/harbor");
  assert.ok(poster);
  assert.equal(poster?.includes("https://menus.example.com/menu/harbor"), true);
  assert.equal(poster?.includes("<script"), false);
  assert.equal(poster?.includes("&lt;script&gt;"), true);
  assert.equal(posterSvg(`<svg><script></script></svg>`, "Cafe", "Scan", "https://menus.example.com/menu/harbor"), null);
  const square = posterSvg(safeQr, "Cafe", "Scan", "https://menus.example.com/menu/harbor", {
    size: "square",
    backgroundHref: "https://cdn.example.com/wall.png",
    logoHref: "javascript:alert(1)",
  });
  assert.equal(square?.includes('width="794" height="794"'), true);
  assert.equal(square?.includes("https://cdn.example.com/wall.png"), true);
  assert.equal(square?.includes("javascript:"), false);
});
