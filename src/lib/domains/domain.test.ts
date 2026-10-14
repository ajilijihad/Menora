import assert from "node:assert/strict";
import test from "node:test";

import { developmentPlatformHost, normalizeHostname, registrablePlatformHost, shouldResolveCustomHost, verificationName } from "./host";

test("hostnames reject addresses, local names, and the deployment host", () => {
  assert.equal(normalizeHostname("Menu.Example.com."), "menu.example.com");
  assert.equal(normalizeHostname("1.2.3.4"), null);
  assert.equal(normalizeHostname("localhost"), null);
  assert.equal(normalizeHostname("printer.local"), null);
  assert.equal(normalizeHostname("not a domain"), null);
  assert.equal(shouldResolveCustomHost("menu.example.com", "menor.example"), true);
  assert.equal(shouldResolveCustomHost("menor.example", "menor.example"), false);
  assert.equal(shouldResolveCustomHost("menor-preview.vercel.app", "menor.example"), false);
  assert.equal(shouldResolveCustomHost("localhost", "menor.example"), false);
});

test("local development registers a stand-in platform host", () => {
  assert.equal(registrablePlatformHost("localhost"), developmentPlatformHost);
  assert.equal(registrablePlatformHost("127.0.0.1"), developmentPlatformHost);
  assert.equal(registrablePlatformHost("menor.example"), "menor.example");
});

test("verification records use a dedicated name", () => {
  assert.equal(verificationName("menu.example.com"), "_menor-verify.menu.example.com");
});
