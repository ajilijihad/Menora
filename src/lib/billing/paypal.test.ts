import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  acceptCapture,
  applyRenewal,
  approveLink,
  captureFacts,
  nextPaidPeriod,
  paypalCertificateHost,
  paypalCheckoutAllowed,
  webhookCapture,
  webhookMayApply,
  webhookRefund,
  type ExpectedPayment,
} from "./paypal";

const expected: ExpectedPayment = {
  paymentId: "11111111-1111-4111-8111-111111111111",
  orderId: "ORDER-1",
  amountCents: 1900,
  currency: "USD",
};

function facts(overrides: Partial<ReturnType<typeof completed>> = {}) {
  return { ...completed(), ...overrides };
}

function completed() {
  return {
    orderId: expected.orderId,
    captureId: "CAPTURE-1",
    status: "COMPLETED",
    currency: "USD",
    minor: 1900,
    customId: expected.paymentId,
  };
}

describe("PayPal capture checks", () => {
  it("rejects a forged capture", () => {
    assert.equal(acceptCapture(expected, facts({ customId: "someone-else" })), false);
    assert.equal(acceptCapture(expected, facts({ captureId: "" })), false);
    assert.equal(acceptCapture(expected, facts({ status: "PENDING" })), false);
    assert.equal(acceptCapture(expected, facts({ orderId: "ORDER-FORGED" })), false);
    assert.equal(captureFacts({
      id: "OTHER-ORDER",
      purchase_units: [{
        custom_id: expected.paymentId,
        payments: { captures: [{ id: "CAPTURE-1", status: "COMPLETED", amount: { currency_code: "USD", value: "19.00" } }] },
      }],
    }, expected.orderId), null);
  });

  it("rejects the wrong amount", () => {
    assert.equal(acceptCapture(expected, facts({ minor: 100 })), false);
    assert.equal(acceptCapture(expected, facts({ minor: 1901 })), false);
  });

  it("rejects the wrong currency", () => {
    assert.equal(acceptCapture(expected, facts({ currency: "EUR" })), false);
    assert.equal(acceptCapture(expected, facts({ currency: "usd" })), false);
  });

  it("accepts a capture that matches the stored payment", () => {
    assert.equal(acceptCapture(expected, facts()), true);
  });
});

describe("manual renewal", () => {
  it("does not grant a second period for a duplicate capture", () => {
    const now = new Date("2026-03-01T00:00:00.000Z");
    const first = applyRenewal({ status: "active", periodEnd: null, captureIds: [] }, "CAPTURE-1", now);
    const duplicate = applyRenewal(first.state, "CAPTURE-1", new Date("2026-03-20T00:00:00.000Z"));

    assert.equal(first.result, "completed");
    assert.equal(duplicate.result, "already_completed");
    assert.equal(duplicate.state.periodEnd, first.state.periodEnd);
    assert.deepEqual(duplicate.state.captureIds, ["CAPTURE-1"]);
  });

  it("extends a later renewal from the current expiration", () => {
    const now = new Date("2026-03-01T00:00:00.000Z");
    const first = applyRenewal({ status: "active", periodEnd: null, captureIds: [] }, "CAPTURE-1", now);
    const second = applyRenewal(first.state, "CAPTURE-2", now);
    const firstEnd = new Date(first.state.periodEnd ?? "");
    const secondPeriod = nextPaidPeriod({
      status: "active",
      periodEnd: first.state.periodEnd,
      now,
    });

    assert.equal(second.result, "completed");
    assert.equal(second.state.periodEnd, secondPeriod.end);
    assert.equal(new Date(secondPeriod.start).toISOString(), firstEnd.toISOString());
    assert.notEqual(second.state.periodEnd, first.state.periodEnd);
    assert.deepEqual(second.state.captureIds, ["CAPTURE-1", "CAPTURE-2"]);
  });
});

describe("PayPal notifications and release gate", () => {
  it("ignores unverified webhook notifications", () => {
    assert.equal(webhookMayApply("FAILURE"), false);
    assert.equal(webhookMayApply(undefined), false);
    assert.equal(webhookMayApply("SUCCESS"), true);
    assert.equal(webhookCapture({ resource: { id: "CAPTURE-1", status: "COMPLETED", custom_id: expected.paymentId, amount: { currency_code: "USD", value: "19.00" } } }), null);
    assert.equal(webhookRefund({
      id: "WH-1",
      event_type: "PAYMENT.CAPTURE.REFUNDED",
      resource: { id: "REFUND-1", status: "PENDING" },
    }), null);
  });

  it("accepts only PayPal approval and certificate hosts", () => {
    assert.equal(approveLink({ links: [{ rel: "approve", href: "https://evil.example/approve" }] }), null);
    assert.equal(approveLink({ links: [{ rel: "payer-action", href: "https://www.sandbox.paypal.com/checkoutnow?token=abc" }] }), "https://www.sandbox.paypal.com/checkoutnow?token=abc");
    assert.equal(paypalCertificateHost("http://api-m.sandbox.paypal.com/cert.pem"), false);
    assert.equal(paypalCertificateHost("https://example.com/cert.pem"), false);
    assert.equal(paypalCertificateHost("https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT"), true);
  });

  it("keeps live payments off until production explicitly enables them", () => {
    assert.equal(paypalCheckoutAllowed({ environment: "sandbox", nodeEnv: "development", livePayments: "false" }), "allowed");
    assert.equal(paypalCheckoutAllowed({ environment: "live", nodeEnv: "development", livePayments: "true" }), "live_in_development");
    assert.equal(paypalCheckoutAllowed({ environment: "live", nodeEnv: "production", livePayments: "false" }), "live_not_released");
    assert.equal(paypalCheckoutAllowed({ environment: "live", nodeEnv: "production", livePayments: "true" }), "allowed");
  });
});
