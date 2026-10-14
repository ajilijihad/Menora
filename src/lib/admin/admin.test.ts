import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canAccessAdmin } from "@/lib/auth/access";

import { adminAccessStatus, adminHref, adminListSize, adminPage, adminSearch, allowedFilter, ilikeContains, pageRange } from "./list";
import { auditActionLabel, balancedShares, countsByDay, dailyCollections, dayList, formatAdminMoney, monthlyRecurring, netByCurrency, paymentSeries, paymentTotals, planRevenue, resolveAdminWindow, signedAdminMoney } from "./overview";

describe("platform administrator access", () => {
  it("denies anonymous visitors and ordinary users, including a direct status check", () => {
    assert.equal(canAccessAdmin(null), false);
    assert.equal(canAccessAdmin({ userId: "user-1", appointed: false }), false);
    assert.equal(adminAccessStatus({ userId: null, appointed: false }), 401);
    assert.equal(adminAccessStatus({ userId: null, appointed: true }), 401);
    assert.equal(adminAccessStatus({ userId: "user-1", appointed: false }), 403);
    assert.equal(adminAccessStatus({ userId: "user-1", appointed: true }), 200);
  });
});

describe("admin lists", () => {
  it("bounds pages and searches and keeps filter links free of unused values", () => {
    assert.equal(adminPage("0"), 1);
    assert.equal(adminPage("3"), 3);
    assert.equal(adminPage("nope"), 1);
    assert.equal(adminSearch('  cafe%,_"()\\  '), "cafe");
    assert.equal(ilikeContains("cafe"), "%cafe%");
    assert.equal(allowedFilter("expired", ["active", "pending", "expired"]), "expired");
    assert.equal(allowedFilter("paid", ["active", "pending"]), "all");
    assert.deepEqual(pageRange(2), { from: 20, to: 39 });
    assert.equal(adminHref("/en/admin/businesses", { q: "harbor", status: "all", page: 1 }), "/en/admin/businesses?q=harbor");
    assert.equal(
      adminHref("/en/admin/payments", { q: "", status: "completed", page: 2 }),
      "/en/admin/payments?status=completed&page=2",
    );
    assert.equal(adminListSize("10"), 10);
    assert.equal(adminListSize("15"), 20);
    assert.equal(adminHref("/en/admin/subscriptions", { q: "ben", status: "active", page: 2, size: 10 }), "/en/admin/subscriptions?q=ben&status=active&page=2&size=10");
  });
});

describe("admin overview window", () => {
  const now = new Date("2026-10-13T15:00:00.000Z");

  it("defaults to the last 30 UTC days and accepts presets", () => {
    const month = resolveAdminWindow({}, now);
    assert.equal(month.preset, 30);
    assert.equal(month.from, "2026-09-14");
    assert.equal(month.to, "2026-10-13");
    assert.equal(month.start, "2026-09-14T00:00:00.000Z");
    assert.equal(month.end, "2026-10-14T00:00:00.000Z");
    assert.equal(resolveAdminWindow({ range: "7" }, now).from, "2026-10-07");
    assert.equal(resolveAdminWindow({ range: "90", from: "2020-01-01" }, now).preset, 90);
  });

  it("clamps custom ranges and rejects impossible dates", () => {
    const custom = resolveAdminWindow({ from: "2026-10-01", to: "2026-10-05" }, now);
    assert.equal(custom.preset, "custom");
    assert.equal(custom.from, "2026-10-01");
    assert.equal(custom.to, "2026-10-05");
    assert.equal(resolveAdminWindow({ from: "2026-11-01", to: "2026-11-05" }, now).preset, 30);
    assert.equal(resolveAdminWindow({ from: "2026-02-31", to: "2026-03-02" }, now).preset, 30);
    assert.equal(resolveAdminWindow({ from: "2025-01-01", to: "2026-10-13" }, now).from, "2025-10-13");
    assert.deepEqual(dayList("2026-10-11", "2026-10-13"), ["2026-10-11", "2026-10-12", "2026-10-13"]);
    assert.deepEqual(countsByDay(["2026-10-11", "2026-10-12"], ["2026-10-11T01:00:00.000Z", "2026-10-13T00:00:00.000Z"]), [1, 0]);
  });

  it("keeps payment currencies separate and makes shares sum to 100", () => {
    const mixed = paymentTotals([
      { amount_cents: 1050, currency: "SAR" },
      { amount_cents: 200, currency: "USD" },
      { amount_cents: 50, currency: "SAR" },
    ]);
    assert.equal(mixed.reliable, true);
    assert.deepEqual(mixed.totals, [
      { currency: "SAR", amountCents: 1100 },
      { currency: "USD", amountCents: 200 },
    ]);
    assert.equal(paymentTotals([{ amount_cents: 10, currency: "XXX" }]).reliable, false);
    assert.deepEqual(balancedShares([1, 1, 1]), [34, 33, 33]);
    assert.equal(balancedShares([1, 1, 1]).reduce((sum, value) => sum + value, 0), 100);
    assert.deepEqual(balancedShares([0, 0]), [0, 0]);
    assert.equal(formatAdminMoney(2940, "USD", "en"), "29.40 USD");
    assert.deepEqual(
      paymentSeries(["2026-10-13"], [{ amount_cents: 500, currency: "SAR", paid_at: "2026-10-13T08:00:00.000Z" }], "SAR"),
      [500],
    );
    assert.equal(paymentSeries(["2026-10-13"], [{ amount_cents: 500, currency: "USD", paid_at: "2026-10-13T08:00:00.000Z" }], "SAR"), null);
    assert.equal(auditActionLabel("plan_created", { plan_created: "Plan created" }), "Plan created");
    assert.equal(auditActionLabel("unknown_action", { plan_created: "Plan created" }), "unknown_action");
  });
});

describe("admin revenue", () => {
  it("keeps currencies separate and subtracts refunds from the same currency", () => {
    assert.deepEqual(
      netByCurrency([{ currency: "USD", amountCents: 4900 }], [{ currency: "USD", amountCents: 1900 }]),
      [{ currency: "USD", amountCents: 3000 }],
    );
    assert.deepEqual(
      netByCurrency(
        [{ currency: "USD", amountCents: 1000 }, { currency: "EUR", amountCents: 500 }],
        [{ currency: "EUR", amountCents: 800 }],
      ),
      [{ currency: "EUR", amountCents: -300 }, { currency: "USD", amountCents: 1000 }],
    );
    assert.equal(signedAdminMoney(-300, "EUR", "en"), "−3.00 EUR");
    assert.equal(planRevenue([{ plan_id: "pro", amount_cents: 4900, currency: "USD" }, { plan_id: null, amount_cents: 1900, currency: "USD" }])?.[0]?.planId, "pro");
    const daily = dailyCollections(
      ["2026-10-12", "2026-10-13"],
      [{ amount_cents: 4900, currency: "USD", paid_at: "2026-10-13T08:00:00.000Z" }],
      [{ amount_cents: 1900, currency: "USD", refunded_at: "2026-10-13T09:00:00.000Z" }],
    );
    assert.deepEqual(daily?.rows, [{ day: "2026-10-13", currency: "USD", collectedCents: 4900, refundedCents: 1900 }]);
    assert.deepEqual(daily?.series[0]?.collected, [0, 4900]);
    assert.deepEqual(
      monthlyRecurring([{ amountCents: 4900, currency: "USD" }, { amountCents: 0, currency: "USD" }], true),
      [{ currency: "USD", amountCents: 4900 }],
    );
    assert.equal(monthlyRecurring([{ amountCents: 100, currency: "USD" }], false), null);
    assert.equal(monthlyRecurring([{ amountCents: 100, currency: "NOPE" }], true), null);
    assert.equal(monthlyRecurring([], true)?.length, 0);
  });
});
