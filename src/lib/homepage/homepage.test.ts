import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultHomepageContent,
  isSafePublicHref,
  mergePlanCards,
  readHomepage,
  type PublicPlan,
} from "./schema";

const plan = (code: string, amountCents: number): PublicPlan => ({
  id: "00000000-0000-4000-8000-000000000010",
  code,
  name: code,
  description: null,
  amountCents,
  currency: "USD",
  maxBusinesses: 1,
  maxProducts: 25,
  maxThemes: 1,
  analyticsRetentionDays: 7,
  customDomains: false,
});

test("homepage content", async (t) => {
  await t.test("accepts the default document and rejects script links", () => {
    const content = defaultHomepageContent();
    assert.equal(content.testimonials.items.length, 0);
    assert.equal(content.testimonials.enabled, false);
    assert.equal(readHomepage(content).valid, true);
    assert.equal(readHomepage({ ...content, hero: { ...content.hero, secondaryHref: "javascript:alert(1)" } }).valid, false);
    assert.equal(isSafePublicHref("#pricing"), true);
    assert.equal(isSafePublicHref("https://menor.example/pricing"), true);
    assert.equal(isSafePublicHref("//evil.example"), false);
    const legacy = structuredClone(content);
    legacy.examples.items[0] = { id: content.examples.items[0]?.id ?? "", enabled: true, theme: "clean-light", title: content.examples.items[0]?.title ?? { en: "", ar: "" }, body: content.examples.items[0]?.body ?? { en: "", ar: "" } } as unknown as (typeof legacy.examples.items)[number];
    const migrated = readHomepage(legacy);
    assert.equal(migrated.valid, true);
    assert.equal(migrated.content.examples.items[0]?.imagePath, "");
    const withoutSite = structuredClone(content) as Record<string, unknown>;
    delete withoutSite.site;
    const kept = readHomepage(withoutSite);
    assert.equal(kept.valid, true);
    assert.deepEqual(kept.content.site.name, { en: "", ar: "" });
    assert.equal(kept.content.site.logoPath, "");
    const named = readHomepage({ ...content, site: { name: "  Grill  ", logoPath: "not-a-logo" } });
    assert.equal(named.valid, true);
    assert.equal(named.content.site.name.en, "Grill");
    assert.equal(named.content.site.name.ar, "");
    assert.equal(named.content.site.logoPath, "");
    const bilingual = readHomepage({ ...content, site: { name: { en: "Menor", ar: "مينور" }, logoPath: "" } });
    assert.equal(bilingual.valid, true);
    assert.equal(bilingual.content.site.name.ar, "مينور");
    const legacyFooter = readHomepage({
      ...content,
      footer: {
        ...content.footer,
        links: [
          { id: content.footer.links[0]?.id ?? "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0101", enabled: true, label: { en: "How", ar: "" }, href: "#how" },
          { id: content.footer.links[1]?.id ?? "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0102", enabled: true, label: { en: "Site", ar: "" }, href: "https://menor.example", kind: "external" },
          { id: content.footer.links[2]?.id ?? "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0103", enabled: false, label: { en: "Later", ar: "" }, href: "", kind: "external" },
        ],
      },
    });
    assert.equal(legacyFooter.valid, true);
    assert.equal(legacyFooter.content.footer.links[0]?.href, "#how-it-works");
    assert.equal(legacyFooter.content.footer.links[0]?.kind, "section");
    assert.equal(legacyFooter.content.footer.links[1]?.kind, "external");
    const invalidExternal = readHomepage({
      ...content,
      footer: {
        ...content.footer,
        links: [{ id: content.footer.links[0]?.id ?? "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0101", enabled: true, label: { en: "Bad", ar: "" }, href: "", kind: "external" }],
      },
    });
    assert.equal(invalidExternal.valid, false);
  });

  await t.test("keeps live plan prices outside the homepage document and shows new plans", () => {
    const content = defaultHomepageContent();
    assert.equal("amountCents" in content.pricing, false);
    const merged = mergePlanCards(content, [plan("free", 0), plan("business", 5900)]);
    assert.deepEqual(
      merged.pricing.cards.map((card) => card.code),
      ["free", "business"],
    );
    assert.equal(merged.pricing.cards[0]?.badge.en, "");
    assert.equal(merged.pricing.cards.at(-1)?.visible, true);
  });
});
