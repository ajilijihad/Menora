import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatClock, formatMoney } from "./format";

describe("locale formatting", () => {
  it("formats money and clock times for English and Arabic", () => {
    const english = formatMoney(1050, "USD", "en");
    const arabic = formatMoney(1050, "USD", "ar");
    assert.match(english, /10\.50/);
    assert.match(arabic, /١٠٫٥٠|10\.50/);
    assert.notEqual(formatClock("09:30", "en"), "");
    assert.equal(formatClock("09:30", "en").includes("09"), true);
    assert.equal(formatClock("9:30", "en"), "");
    assert.match(formatClock("09:30", "ar"), /٠٩|09/);
  });
});
