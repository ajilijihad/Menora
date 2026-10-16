import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canAccessAdmin, canResetPassword, sessionGate } from "./access";
import { resolveAuthCallback } from "./callback";
import {
  isObfuscatedExistingUser,
  mapAuthError,
  publicForgotPasswordResult,
} from "./errors";
import { clientIpFromForwarded } from "./ip";
import { profileUpdatePayload, signUpOptions } from "./metadata";
import { buildAvatarPath, isSafeAvatarPath, publicAvatarUrl } from "./avatar";
import { authConfirmRedirect, safeNextPath } from "./paths";
import { authRateLimits, createRateLimiter } from "./rate-limit";
import { parseLogin, parseRegister, parseReset } from "./schemas";
import { localeRedirectPath, preferredLocale } from "../i18n/locales";

describe("registration", () => {
  it("accepts a name, email, and password and stores only the name in metadata", () => {
    const parsed = parseRegister({
      name: "  ليلى حسن  ",
      email: "layla@example.com",
      password: "secret12",
      confirmPassword: "secret12",
    });

    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }

    const options = signUpOptions(parsed.data.name, "https://app.example/auth/confirm");
    assert.deepEqual(options.data, { full_name: "ليلى حسن" });
    assert.equal("is_platform_admin" in options.data, false);
    assert.equal("app_metadata" in options, false);
  });

  it("rejects a weak password, a mismatch, and an invalid email", () => {
    const parsed = parseRegister({
      name: "",
      email: "not-an-email",
      password: "password",
      confirmPassword: "other",
    });

    assert.equal(parsed.ok, false);
    if (parsed.ok) {
      return;
    }

    assert.equal(parsed.fieldErrors.name, "name_required");
    assert.equal(parsed.fieldErrors.email, "email_invalid");
    assert.equal(parsed.fieldErrors.password, "password_weak");
  });

  it("rejects a common password that otherwise meets the character rules", () => {
    const parsed = parseRegister({
      name: "Layla",
      email: "layla@example.com",
      password: "password1",
      confirmPassword: "password1",
    });

    assert.equal(parsed.ok, false);
    if (parsed.ok) {
      return;
    }

    assert.equal(parsed.fieldErrors.password, "password_common");
  });

  it("treats an empty identity list as an existing account", () => {
    assert.equal(isObfuscatedExistingUser({ identities: [] }), true);
    assert.equal(isObfuscatedExistingUser({ identities: [{ id: "1" }] }), false);
  });
});

describe("verification", () => {
  it("accepts a token hash and a recovery code, and drops an unsafe next path", () => {
    const otp = resolveAuthCallback({
      tokenHash: "hash",
      type: "signup",
      code: null,
      next: "/en/dashboard",
    });
    assert.deepEqual(otp, {
      kind: "otp",
      type: "signup",
      tokenHash: "hash",
      next: "/en/dashboard",
    });

    const recovery = resolveAuthCallback({
      tokenHash: null,
      type: "recovery",
      code: "pkce-code",
      next: "https://evil.example",
    });
    assert.equal(recovery.kind, "code");
    if (recovery.kind !== "code") {
      return;
    }
    assert.equal(recovery.next, "/en/reset-password");

    assert.equal(
      resolveAuthCallback({
        tokenHash: "hash",
        type: "not-a-type",
        code: null,
        next: null,
      }).kind,
      "invalid",
    );
  });
});

describe("login and logout", () => {
  it("sends an anonymous visitor from the dashboard and admin to login", () => {
    assert.deepEqual(sessionGate("/en/dashboard", false), {
      type: "redirect",
      pathname: "/en/login",
      search: "?next=%2Fen%2Fdashboard",
    });
    assert.equal(sessionGate("/ar/admin/settings", false).type, "redirect");
    const paypalReturn = sessionGate(
      "/en/dashboard/businesses/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/billing/paypal/return",
      false,
      "?token=ORDER-1",
    );
    assert.equal(paypalReturn.type, "redirect");
    if (paypalReturn.type === "redirect") {
      assert.equal(
        paypalReturn.search,
        "?next=%2Fen%2Fdashboard%2Fbusinesses%2Faaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa%2Fbilling%2Fpaypal%2Freturn%3Ftoken%3DORDER-1",
      );
    }
    assert.deepEqual(sessionGate("/en", false), { type: "allow" });
    assert.deepEqual(sessionGate("/en/m/cafe", false), { type: "allow" });
  });

  it("sends a signed-in visitor away from login and back to protected routes after logout", () => {
    assert.deepEqual(sessionGate("/ar/login", true), {
      type: "redirect",
      pathname: "/ar/dashboard",
      search: "",
    });
    assert.equal(sessionGate("/en/dashboard", false).type, "redirect");
    assert.equal(mapAuthError({ message: "Invalid login credentials" }), "invalid_credentials");
    assert.equal(mapAuthError({ message: "Email not confirmed" }), "email_unconfirmed");
  });

  it("rejects an external next path", () => {
    assert.equal(safeNextPath("https://evil.example"), null);
    assert.equal(safeNextPath("//evil.example"), null);
    assert.equal(safeNextPath("/en/../admin"), null);
    assert.equal(safeNextPath("/en/dashboard/profile"), "/en/dashboard/profile");
    assert.equal(
      authConfirmRedirect("http://localhost:3000", "/ar/reset-password"),
      "http://localhost:3000/auth/confirm?next=%2Far%2Freset-password",
    );
  });
});

describe("password reset", () => {
  it("requires a verified recovery session and a matching password", () => {
    assert.equal(canResetPassword(false), false);
    assert.equal(canResetPassword(true), true);
    assert.equal(sessionGate("/en/reset-password", false).type, "allow");

    const parsed = parseReset({ password: "secret12", confirmPassword: "secret12" });
    assert.equal(parsed.ok, true);

    const mismatch = parseReset({ password: "secret12", confirmPassword: "secret13" });
    assert.equal(mismatch.ok, false);
    if (!mismatch.ok) {
      assert.equal(mismatch.fieldErrors.confirmPassword, "password_mismatch");
    }
  });

  it("does not reveal whether a forgot-password email exists", () => {
    assert.equal(publicForgotPasswordResult(null), "success");
    assert.equal(
      publicForgotPasswordResult({ message: "User not found", status: 400 }),
      "success",
    );
    assert.equal(
      publicForgotPasswordResult({ message: "rate limit", status: 429 }),
      "rate_limited",
    );
    assert.equal(
      publicForgotPasswordResult({ message: "upstream", status: 500 }),
      "auth_failed",
    );
  });
});

describe("unauthorized access", () => {
  it("does not grant admin from registration metadata or a mismatched user id", () => {
    const options = signUpOptions("Nour", "https://app.example/auth/confirm");
    assert.deepEqual(profileUpdatePayload("Nour"), { full_name: "Nour" });
    assert.equal(Object.keys(options.data).join(","), "full_name");
    assert.equal(canAccessAdmin({ userId: "user-1", appointed: false }), false);
    assert.equal(canAccessAdmin(null), false);
    assert.equal(canAccessAdmin({ userId: "user-1", appointed: true }), true);
  });

  it("limits sensitive attempts and uses only the first forwarded address", () => {
    let now = 1_000;
    const limiter = createRateLimiter(() => now);
    const rule = authRateLimits.login;

    for (let attempt = 0; attempt < rule.limit; attempt += 1) {
      assert.equal(limiter.consume("login:203.0.113.4", rule).ok, true);
    }

    const blocked = limiter.consume("login:203.0.113.4", rule);
    assert.equal(blocked.ok, false);
    now += rule.windowMs;
    assert.equal(limiter.consume("login:203.0.113.4", rule).ok, true);
    assert.equal(
      clientIpFromForwarded("203.0.113.4, 198.51.100.10", "198.51.100.10"),
      "203.0.113.4",
    );
  });
});

describe("locale", () => {
  it("keeps public pages on the preferred locale and leaves auth callbacks stable", () => {
    assert.equal(preferredLocale("ar", "en"), "ar");
    assert.equal(localeRedirectPath("/", undefined, "ar-SA,en;q=0.8"), "/ar");
    assert.equal(localeRedirectPath("/en", "ar", "en"), null);
    assert.equal(localeRedirectPath("/auth/confirm", "ar", "ar"), null);
    assert.equal(localeRedirectPath("/robots.txt", "ar", "ar"), null);
    assert.equal(localeRedirectPath("/sitemap.xml", "en", "ar"), null);
    assert.equal(localeRedirectPath("/dashboard", "en", "ar"), "/en/dashboard");
  });

  it("rejects a login with a missing password", () => {
    const parsed = parseLogin({ email: "layla@example.com", password: "" });
    assert.equal(parsed.ok, false);
  });
});

describe("profile picture", () => {
  it("keeps an avatar path inside the owner's folder and rejects anything else", () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const fileId = "22222222-2222-4222-8222-222222222222";
    const path = buildAvatarPath(userId, "jpg", fileId);
    assert.equal(isSafeAvatarPath(userId, path), true);
    assert.equal(isSafeAvatarPath("33333333-3333-4333-8333-333333333333", path), false);
    assert.equal(isSafeAvatarPath(userId, `${userId}/logo-${fileId}.jpg`), false);
    assert.equal(publicAvatarUrl("https://example.supabase.co", path), `https://example.supabase.co/storage/v1/object/public/profile-media/${path}`);
    assert.equal(publicAvatarUrl("https://example.supabase.co", "../secret.jpg"), null);
  });
});
