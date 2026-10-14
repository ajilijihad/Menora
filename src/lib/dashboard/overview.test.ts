import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { defaultAppearance } from "@/lib/menus/appearance";

import { appearanceMatchesDefault, daysRemaining, overviewChecklist, overviewPercent, viewTrend } from "./overview";

describe("dashboard overview", () => {
  it("counts only completed setup steps", () => {
    const steps = overviewChecklist({
      hasInfo: true,
      categoryCount: 2,
      productCount: 0,
      designSaved: false,
      published: true,
    });

    assert.deepEqual(
      steps.map((step) => step.done),
      [true, true, false, false, true],
    );
    assert.equal(overviewPercent(steps), 60);
  });

  it("counts a saved design even when it matches the theme defaults", () => {
    const steps = overviewChecklist({
      hasInfo: true,
      categoryCount: 1,
      productCount: 1,
      designSaved: true,
      published: false,
    });

    assert.equal(steps.find((step) => step.id === "design")?.done, true);
    assert.equal(steps.find((step) => step.id === "publish")?.done, false);
  });

  it("treats an untouched theme as not customized", () => {
    assert.equal(appearanceMatchesDefault(defaultAppearance("modern-dark")), true);
    assert.equal(appearanceMatchesDefault({ ...defaultAppearance("clean-light"), primary: "#FF5A24" }), false);
  });

  it("hides a view trend when the earlier period has no views", () => {
    assert.equal(viewTrend([{ menu: 0 }, { menu: 4 }]), null);
    assert.equal(viewTrend([{ menu: 10 }, { menu: 15 }]), 50);
  });

  it("counts whole days left in a paid period", () => {
    const now = new Date("2026-10-01T00:00:00.000Z");
    assert.equal(daysRemaining("2026-10-17T00:00:00.000Z", now), 16);
    assert.equal(daysRemaining(null, now), null);
    assert.equal(daysRemaining("2026-09-01T00:00:00.000Z", now), 0);
  });
});
