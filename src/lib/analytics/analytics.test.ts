import assert from "node:assert/strict";
import test from "node:test";

import { allowCollect, analyticsWindow, deviceCategory, referrerSource, resetCollectLimiter, visitorHash } from "./collect";
import { csvCell, inclusiveDays, periodChange, previousWindow, sharePercent } from "./present";

test("device categories come from the user agent without storing it", () => {
  assert.equal(deviceCategory("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), "mobile");
  assert.equal(deviceCategory("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "tablet");
  assert.equal(deviceCategory("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "desktop");
  assert.equal(deviceCategory(""), "unknown");
});

test("referrers keep only a source category", () => {
  assert.equal(referrerSource(null, "menor.example"), "direct");
  assert.equal(referrerSource("https://menor.example/menu/harbor", "menor.example"), "direct");
  assert.equal(referrerSource("https://www.google.com/search?q=harbor+secret", "menor.example"), "search");
  assert.equal(referrerSource("https://l.instagram.com/reel", "menor.example"), "social");
  assert.equal(referrerSource("https://news.example/story?email=person@example.com", "menor.example"), "other");
  assert.equal(referrerSource("not a url", "menor.example"), "direct");
});

test("visitor hashes do not contain the address", () => {
  const hash = visitorHash("203.0.113.10", "Mozilla/5.0", "2026-10-13");
  assert.equal(hash.length, 64);
  assert.equal(hash.includes("203.0.113.10"), false);
  assert.notEqual(hash, visitorHash("203.0.113.11", "Mozilla/5.0", "2026-10-13"));
  assert.equal(hash, visitorHash("203.0.113.10", "Mozilla/5.0", "2026-10-13"));
});

test("repeated collection from one address is limited", () => {
  resetCollectLimiter();
  const now = 1_000_000;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    assert.equal(allowCollect("203.0.113.10|harbor", now), true);
  }
  assert.equal(allowCollect("203.0.113.10|harbor", now), false);
  assert.equal(allowCollect("203.0.113.10|harbor", now + 60_000), true);
});

test("period comparisons stay quiet when the previous total is zero", () => {
  assert.equal(periodChange(3, 1), 200);
  assert.equal(periodChange(1, 3), -67);
  assert.equal(periodChange(4, 0), null);
  assert.equal(periodChange(0, 0), null);
  assert.equal(previousWindow("2026-10-06", "2026-10-13")?.from, "2026-09-28");
  assert.equal(previousWindow("2026-10-06", "2026-10-13")?.to, "2026-10-05");
  assert.equal(inclusiveDays("2026-10-06", "2026-10-13"), 8);
  assert.equal(previousWindow("2026-10-12", "2026-10-01"), null);
});

test("csv cells escape quotes and share percentages avoid a zero total", () => {
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("plain"), "plain");
  assert.equal(sharePercent(3, 0), 0);
  assert.equal(sharePercent(1, 3), 33);
});

test("analytics dates stay inside retention and one year", () => {
  const now = new Date("2026-10-13T12:00:00.000Z");
  const window = analyticsWindow("2020-01-01", "2026-10-13", 7, now);
  assert.equal(window?.from, "2026-10-06");
  assert.equal(window?.to, "2026-10-13");
  assert.equal(analyticsWindow("2026-10-12", "2026-10-01", 30, now), null);
});
