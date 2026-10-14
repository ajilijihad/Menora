import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canDeleteBusiness, canEditBusiness } from "./access";
import { buildMediaPath, imageExtension, isSafeMediaPath, maxImageBytes } from "./media";
import { setupPercent, setupProgress } from "./progress";
import { emptyOpeningHours, parseBusinessForm } from "./schema";
import { isPublicSlug, slugifyName, uniqueSlug } from "./slug";

const businessId = "c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1";

describe("business slug", () => {
  it("builds a url-safe slug and avoids collisions", () => {
    assert.equal(slugifyName("  North Café & Grill "), "north-cafe-and-grill");
    assert.equal(slugifyName("مقهى النور"), "");
    assert.equal(isPublicSlug("north-cafe"), true);
    assert.equal(isPublicSlug("North Cafe"), false);
    assert.equal(isPublicSlug("../admin"), false);

    const taken = new Set(["north-cafe", "north-cafe-2"]);
    assert.equal(
      uniqueSlug("north-cafe", (slug) => taken.has(slug)),
      "north-cafe-3",
    );
    assert.equal(
      uniqueSlug("", () => false),
      "business",
    );
  });
});

describe("business profile validation", () => {
  it("accepts a complete cafe profile and rejects unsafe links", () => {
    const parsed = parseBusinessForm({
      name: "North Cafe",
      slug: "north-cafe",
      businessType: "cafe",
      description: "Coffee and pastries",
      phone: "+1 202 555 0100",
      address: "12 Market Street",
      mapUrl: "https://maps.example/north",
      defaultLanguage: "ar",
      timeZone: "Asia/Riyadh",
      instagram: "https://instagram.com/north",
      mondayClosed: "",
      mondayOpens: "08:00",
      mondayCloses: "18:00",
      tuesdayClosed: "on",
      wednesdayClosed: "on",
      thursdayClosed: "on",
      fridayClosed: "on",
      saturdayClosed: "on",
      sundayClosed: "on",
    });

    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }

    assert.equal(parsed.data.openingHours.monday.closed, false);
    assert.equal(parsed.data.openingHours.sunday.closed, true);
    assert.equal(parsed.data.socialLinks.instagram, "https://instagram.com/north");

    const unsafe = parseBusinessForm({
      name: "North Cafe",
      slug: "not safe",
      businessType: "restaurant",
      mapUrl: "javascript:alert(1)",
      phone: "call-me",
      website: "http://example.com",
    });
    assert.equal(unsafe.ok, false);
    if (unsafe.ok) {
      return;
    }

    assert.equal(unsafe.fieldErrors.slug, "slug_invalid");
    assert.equal(unsafe.fieldErrors.mapUrl, "map_invalid");
    assert.equal(unsafe.fieldErrors.phone, "phone_invalid");
    assert.equal(unsafe.fieldErrors.social, "social_invalid");
  });
});

describe("business media", () => {
  it("keeps uploads inside the business folder and limits the file", () => {
    assert.equal(imageExtension("image/jpeg"), "jpg");
    assert.equal(imageExtension("image/svg+xml"), null);
    assert.equal(maxImageBytes <= 2_097_152, true);

    const path = buildMediaPath(
      businessId,
      "logo",
      "png",
      "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    );
    assert.equal(isSafeMediaPath(businessId, path, "logo"), true);
    assert.equal(
      isSafeMediaPath(businessId, `${businessId}/../logo-dddddddd-dddd-4ddd-8ddd-dddddddddddd.png`),
      false,
    );
    assert.equal(
      isSafeMediaPath(
        businessId,
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/logo-dddddddd-dddd-4ddd-8ddd-dddddddddddd.png",
      ),
      false,
    );
  });
});

describe("business authorization and setup", () => {
  it("lets owners and managers edit, and only owners delete", () => {
    assert.equal(canEditBusiness("owner"), true);
    assert.equal(canEditBusiness("manager"), true);
    assert.equal(canEditBusiness("editor"), false);
    assert.equal(canEditBusiness(null), false);
    assert.equal(canDeleteBusiness("owner"), true);
    assert.equal(canDeleteBusiness("manager"), false);
  });

  it("tracks unfinished profile steps", () => {
    const hours = emptyOpeningHours();
    hours.monday = { closed: false, opens: "08:00", closes: "18:00" };
    const steps = setupProgress({
      description: "Coffee",
      phone: null,
      address: null,
      mapUrl: null,
      openingHours: hours,
      socialLinks: {},
      logoPath: null,
      coverPath: null,
    });

    assert.equal(steps.find((step) => step.id === "description")?.done, true);
    assert.equal(steps.find((step) => step.id === "hours")?.done, true);
    assert.equal(steps.find((step) => step.id === "logo")?.done, false);
    assert.equal(setupPercent(steps), 25);
  });
});
