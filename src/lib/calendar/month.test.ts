import assert from "node:assert/strict";
import test from "node:test";

import { daysInMonth, isIsoDay, monthGrid, shiftMonth, weekStartsOn } from "./month";

test("rejects impossible dates and accepts leap day", () => {
  assert.equal(isIsoDay("2026-02-31"), false);
  assert.equal(isIsoDay("2024-02-29"), true);
  assert.equal(isIsoDay("2025-02-29"), false);
  assert.equal(daysInMonth(2024, 1), 29);
  assert.equal(daysInMonth(2025, 1), 28);
});

test("month navigation crosses year boundaries", () => {
  assert.equal(shiftMonth("2026-12-01", 1), "2027-01-01");
  assert.equal(shiftMonth("2026-01-01", -1), "2025-12-01");
});

test("grids stay on the locale week start and include neighboring days", () => {
  assert.equal(weekStartsOn("en"), 0);
  assert.equal(weekStartsOn("ar"), 6);
  const english = monthGrid("2026-09-01", 0);
  const arabic = monthGrid("2026-09-01", 6);
  assert.equal(english.length, 42);
  assert.equal(english[0], "2026-08-30");
  assert.equal(arabic[0], "2026-08-29");
  assert.ok(english.includes("2026-09-17"));
  assert.ok(english.includes("2026-10-03"));
});
