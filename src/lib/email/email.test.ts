import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cronAuthorized } from "./cron";
import {
  dueReminder,
  emailTemplates,
  paymentEmailKind,
  previewFacts,
  recordedDelivery,
  renderEmail,
} from "./messages";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-13T06:00:00.000Z");

describe("reminder windows", () => {
  it("selects the 7, 3, and 1 day windows and the expired state", () => {
    assert.equal(dueReminder(new Date(now.getTime() + 7 * day + 1), now), null);
    assert.equal(dueReminder(new Date(now.getTime() + 7 * day), now), "reminder_7");
    assert.equal(dueReminder(new Date(now.getTime() + 4 * day), now), "reminder_7");
    assert.equal(dueReminder(new Date(now.getTime() + 3 * day), now), "reminder_3");
    assert.equal(dueReminder(new Date(now.getTime() + 2 * day), now), "reminder_3");
    assert.equal(dueReminder(new Date(now.getTime() + day), now), "reminder_1");
    assert.equal(dueReminder(new Date(now.getTime() + 60 * 60 * 1000), now), "reminder_1");
    assert.equal(dueReminder(now, now), "expired");
    assert.equal(dueReminder(new Date(now.getTime() - day), now), "expired");
  });

  it("treats a later completed payment as a renewal", () => {
    assert.equal(paymentEmailKind(1), "payment_receipt");
    assert.equal(paymentEmailKind(2), "renewal_confirmation");
  });
});

describe("email delivery records", () => {
  it("records a send only when Resend returns a message id", () => {
    assert.equal(recordedDelivery({ providerMessageId: "re_123", error: null }), "sent");
    assert.equal(recordedDelivery({ providerMessageId: null, error: "rejected" }), "failed");
    assert.equal(recordedDelivery({ providerMessageId: "re_123", error: "rejected" }), "failed");
    assert.equal(recordedDelivery({ providerMessageId: null, error: null }), "failed");
  });

  it("rejects a scheduled run without the bearer secret", () => {
    assert.equal(cronAuthorized(null, "a-long-enough-secret"), false);
    assert.equal(cronAuthorized("Bearer wrong-secret-value", "a-long-enough-secret"), false);
    assert.equal(cronAuthorized("Bearer short", "short"), false);
    assert.equal(cronAuthorized("Bearer a-long-enough-secret", "a-long-enough-secret"), true);
  });
});

describe("email templates", () => {
  it("renders English left to right and Arabic right to left with a plain-text alternative", () => {
    for (const template of emailTemplates) {
      const english = renderEmail(template, "en", previewFacts);
      const arabic = renderEmail(template, "ar", { ...previewFacts, businessName: "مطعم <script>" });
      assert.match(english.html, /dir="ltr"/);
      assert.match(arabic.html, /dir="rtl"/);
      assert.match(arabic.html, /مطعم &lt;script&gt;/);
      assert.equal(english.text.includes(english.subject), true);
      assert.equal(arabic.text.length > 0, true);
      assert.equal(english.html.includes("<script>"), false);
    }
  });

  it("labels a receipt as a payment receipt and not a tax invoice", () => {
    const receipt = renderEmail("payment_receipt", "en", previewFacts);
    const renewal = renderEmail("renewal_confirmation", "ar", previewFacts);
    assert.match(receipt.text, /not a tax invoice/);
    assert.match(receipt.html, /CAPTURE-PREVIEW/);
    assert.match(receipt.text, /\$19\.00 USD/);
    assert.match(renewal.text, /ليس فاتورة ضريبية/);
    assert.match(renewal.html, /Harbor Grill/);
  });
});
