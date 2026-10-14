import { z } from "zod";

import type { Locale } from "@/lib/i18n/locales";

export const homepageSectionIds = ["hero", "features", "how", "examples", "pricing", "testimonials", "faq", "cta"] as const;
export type HomepageSectionId = (typeof homepageSectionIds)[number];

export const featureIcons = ["zap", "palette", "sliders", "chart"] as const;
export type FeatureIcon = (typeof featureIcons)[number];

export const socialNetworks = ["instagram", "facebook", "tiktok", "x", "linkedin", "youtube"] as const;
export type SocialNetwork = (typeof socialNetworks)[number];

export const sectionAnchors = {
  hero: "hero",
  features: "features",
  how: "how-it-works",
  examples: "menu-examples",
  pricing: "pricing",
  testimonials: "testimonials",
  faq: "faq",
  cta: "bottom",
} as const satisfies Record<HomepageSectionId, string>;

export const contactAnchor = "contact";
export type FooterLinkKind = "section" | "external";
export type FooterTargetId = HomepageSectionId | "contact";

const legacyAnchors: Record<string, string> = {
  top: sectionAnchors.hero,
  how: sectionAnchors.how,
  examples: sectionAnchors.examples,
  start: sectionAnchors.cta,
};

export function hrefForSection(id: FooterTargetId): string {
  return `#${id === "contact" ? contactAnchor : sectionAnchors[id]}`;
}

export function sectionIdForHref(href: string): FooterTargetId | null {
  const raw = href.startsWith("#") ? href.slice(1) : href;
  const canonical = legacyAnchors[raw] ?? raw;
  const match = (Object.entries(sectionAnchors) as Array<[HomepageSectionId, string]>).find(([, anchor]) => anchor === canonical);
  if (match) {
    return match[0];
  }
  return canonical === contactAnchor ? "contact" : null;
}

export function footerLinkKind(href: string, kind?: FooterLinkKind): FooterLinkKind {
  if (kind) {
    return kind;
  }
  return href.startsWith("#") || href === "" ? "section" : "external";
}

export function normalizeFooterHref(href: string, kind: FooterLinkKind): string {
  if (kind !== "section" || !href.startsWith("#")) {
    return href;
  }
  const id = sectionIdForHref(href);
  return id ? hrefForSection(id) : href;
}

export function legacySectionAnchor(id: HomepageSectionId): string | null {
  const current = sectionAnchors[id];
  const legacy = Object.entries(legacyAnchors).find(([, value]) => value === current)?.[0];
  return legacy && legacy !== current ? legacy : null;
}

const imagePathPattern = /^homepage\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export function isHomepageImagePath(path: string): boolean {
  return imagePathPattern.test(path);
}

function localized(max: number) {
  return z.object({
    en: z.string().trim().max(max),
    ar: z.string().trim().max(max),
  });
}

const safeLink = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === "" || isSafePublicHref(value), "invalid_link");

const email = z
  .string()
  .trim()
  .max(120)
  .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "invalid_email");

const entryId = z.string().uuid();

const featureSchema = z.object({
  id: entryId,
  enabled: z.boolean(),
  icon: z.enum(featureIcons),
  title: localized(80),
  body: localized(240),
});

const stepSchema = z.object({
  id: entryId,
  enabled: z.boolean(),
  title: localized(80),
  body: localized(240),
});

const exampleSchema = z
  .object({
    id: entryId,
    enabled: z.boolean(),
    theme: z.string().max(40).optional(),
    imagePath: z.string().optional().default(""),
    imageAlt: localized(140).optional(),
    title: localized(80),
    body: localized(180),
  })
  .transform((item) => ({
    id: item.id,
    enabled: item.enabled,
    imagePath: item.imagePath && isHomepageImagePath(item.imagePath) ? item.imagePath : "",
    imageAlt: item.imageAlt ?? { en: "", ar: "" },
    title: item.title,
    body: item.body,
  }));

const testimonialSchema = z.object({
  id: entryId,
  enabled: z.boolean(),
  name: localized(80),
  role: localized(80),
  quote: localized(400),
});

const faqSchema = z.object({
  id: entryId,
  enabled: z.boolean(),
  question: localized(180),
  answer: localized(600),
});

const linkSchema = z
  .object({
    id: entryId,
    enabled: z.boolean(),
    label: localized(40),
    href: safeLink,
    kind: z.enum(["section", "external"]).optional(),
  })
  .superRefine((link, ctx) => {
    const kind = footerLinkKind(link.href, link.kind);
    if (link.enabled && kind === "external" && !isSafePublicHref(link.href)) {
      ctx.addIssue({ code: "custom", message: "invalid_link", path: ["href"] });
    }
  })
  .transform((link) => {
    const kind = footerLinkKind(link.href, link.kind);
    return {
      id: link.id,
      enabled: link.enabled,
      label: link.label,
      kind,
      href: normalizeFooterHref(link.href, kind),
    };
  });

const planCardSchema = z.object({
  code: z.string().trim().regex(/^[a-z0-9_]+$/).max(40),
  visible: z.boolean(),
  badge: localized(40),
  blurb: localized(180),
  features: z.array(localized(80)).max(8),
  cta: localized(40),
});

const socialSchema = z.object({
  network: z.enum(socialNetworks),
  enabled: z.boolean(),
  url: safeLink,
});

export const homepageSchema = z.object({
  order: z
    .array(z.enum(homepageSectionIds))
    .length(homepageSectionIds.length)
    .refine((items) => new Set(items).size === homepageSectionIds.length, "order"),
  nav: z.object({
    features: localized(40),
    pricing: localized(40),
    how: localized(40),
    examples: localized(40),
    faq: localized(40),
    login: localized(40),
    register: localized(40),
  }),
  hero: z.object({
    enabled: z.boolean(),
    badge: localized(80),
    title: localized(140),
    description: localized(500),
    primaryLabel: localized(40),
    secondaryLabel: localized(40),
    secondaryHref: safeLink,
    imagePath: z.string().refine((value) => value === "" || isHomepageImagePath(value)),
    imageAlt: localized(140),
    points: z.array(localized(60)).max(4),
  }),
  features: z.object({
    enabled: z.boolean(),
    title: localized(120),
    items: z.array(featureSchema).max(8),
  }),
  how: z.object({
    enabled: z.boolean(),
    eyebrow: localized(40),
    title: localized(140),
    items: z.array(stepSchema).max(6),
  }),
  examples: z.object({
    enabled: z.boolean(),
    eyebrow: localized(40),
    title: localized(140),
    description: localized(240),
    items: z.array(exampleSchema).max(6),
  }),
  pricing: z.object({
    enabled: z.boolean(),
    eyebrow: localized(40),
    title: localized(140),
    description: localized(300),
    cards: z.array(planCardSchema).max(12),
  }),
  testimonials: z.object({
    enabled: z.boolean(),
    title: localized(140),
    items: z.array(testimonialSchema).max(8),
  }),
  faq: z.object({
    enabled: z.boolean(),
    title: localized(140),
    items: z.array(faqSchema).max(16),
  }),
  cta: z.object({
    enabled: z.boolean(),
    title: localized(140),
    description: localized(240),
    label: localized(40),
  }),
  footer: z.object({
    enabled: z.boolean(),
    description: localized(240),
    links: z.array(linkSchema).max(10),
  }),
  contact: z.object({
    email,
    phone: z.string().trim().max(40),
    address: localized(200),
    supportUrl: safeLink,
    socials: z.array(socialSchema).length(socialNetworks.length),
  }),
  site: z
    .object({
      name: z.preprocess(
        (value) => (typeof value === "string" ? { en: value, ar: "" } : value ?? { en: "", ar: "" }),
        localized(80),
      ),
      logoPath: z.string().optional().default(""),
    })
    .optional()
    .default({ name: { en: "", ar: "" }, logoPath: "" })
    .transform((site) => ({
      name: site.name,
      logoPath: site.logoPath && isHomepageImagePath(site.logoPath) ? site.logoPath : "",
    })),
  seo: z.object({
    title: localized(70),
    description: localized(180),
    ogTitle: localized(70),
    ogDescription: localized(180),
    imagePath: z.string().refine((value) => value === "" || isHomepageImagePath(value)),
    imageAlt: localized(140),
    index: z.boolean(),
  }),
});

export type HomepageContent = z.infer<typeof homepageSchema>;
export type LocalizedText = HomepageContent["hero"]["title"];
export type PlanCard = HomepageContent["pricing"]["cards"][number];

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  amountCents: number;
  currency: string;
  maxBusinesses: number;
  maxProducts: number;
  maxThemes: number;
  analyticsRetentionDays: number;
  customDomains: boolean;
};

const text = (en: string, ar: string): LocalizedText => ({ en, ar });

const ids = {
  instant: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0001",
  design: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0002",
  manage: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0003",
  growth: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0004",
  step1: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0011",
  step2: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0012",
  step3: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0013",
  modern: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0021",
  minimal: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0022",
  dark: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0023",
  faq1: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0031",
  faq2: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0032",
  faq3: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0033",
  faq4: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0034",
  faq5: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0035",
  faq6: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0036",
  linkFeatures: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0041",
  linkPricing: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0042",
  linkHow: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0043",
  linkFaq: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0044",
  linkPrivacy: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0045",
  linkTerms: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0046",
  linkSupport: "6f1c0a2e-1b4a-4c1a-9a11-0a0b0c0d0047",
} as const;

export function defaultHomepageContent(): HomepageContent {
  return homepageSchema.parse({
    order: [...homepageSectionIds],
    nav: {
      features: text("Features", "المزايا"),
      pricing: text("Pricing", "الأسعار"),
      how: text("How it works", "كيف يعمل"),
      examples: text("Menu examples", "أمثلة القوائم"),
      faq: text("FAQ", "الأسئلة"),
      login: text("Log in", "تسجيل الدخول"),
      register: text("Create account", "إنشاء حساب"),
    },
    hero: {
      enabled: true,
      badge: text("Digital Menus for Restaurants", "قوائم رقمية للمطاعم"),
      title: text("Digital menus for every location.", "قوائم رقمية لكل فرع."),
      description: text(
        "Menor helps restaurants and multi-location businesses create beautiful digital menus that customers can open instantly — no app, no account, just a link or QR code.",
        "يساعد مينور المطاعم والأعمال متعددة الفروع على إنشاء قوائم رقمية جميلة يفتحها الزبائن فورًا — بلا تطبيق وبلا حساب، فقط عبر رابط أو رمز QR.",
      ),
      primaryLabel: text("Create your menu", "أنشئ قائمتك"),
      secondaryLabel: text("View live demo", "عرض مثال حي"),
      secondaryHref: "#menu-examples",
      imagePath: "",
      imageAlt: text("Sample digital menu on a phone beside a QR code", "قائمة رقمية تجريبية على هاتف بجانب رمز QR"),
      points: [
        text("No app required", "بلا تطبيق"),
        text("Easy to set up", "إعداد سهل"),
        text("Works on all devices", "يعمل على كل الأجهزة"),
      ],
    },
    features: {
      enabled: true,
      title: text("", ""),
      items: [
        { id: ids.instant, enabled: true, icon: "zap", title: text("Instant access", "وصول فوري"), body: text("Customers can view your menu by scanning a QR code or visiting a simple link.", "يشاهد الزبائن قائمتك بمسح رمز QR أو عبر رابط بسيط.") },
        { id: ids.design, enabled: true, icon: "palette", title: text("Beautiful design", "تصميم جميل"), body: text("Modern and mobile-friendly menus that match your brand.", "قوائم حديثة ومناسبة للجوال وتتوافق مع هويتك.") },
        { id: ids.manage, enabled: true, icon: "sliders", title: text("Easy management", "إدارة سهلة"), body: text("Update items, prices, and photos anytime from your dashboard.", "حدّث الأصناف والأسعار والصور في أي وقت من لوحة التحكم.") },
        { id: ids.growth, enabled: true, icon: "chart", title: text("Built for growth", "جاهز للنمو"), body: text("Perfect for single or multi-location businesses with powerful tools and analytics.", "مناسب لفرع واحد أو عدة فروع مع أدوات وتحليلات عملية.") },
      ],
    },
    how: {
      enabled: true,
      eyebrow: text("How it works", "كيف يعمل"),
      title: text("Get your digital menu in minutes.", "احصل على قائمتك الرقمية خلال دقائق."),
      items: [
        { id: ids.step1, enabled: true, title: text("Create your account", "أنشئ حسابك"), body: text("Sign up and set up your business information.", "سجّل وأضف معلومات عملك.") },
        { id: ids.step2, enabled: true, title: text("Add your menu", "أضف قائمتك"), body: text("Upload your items, categories, prices, and photos.", "أضف الأصناف والتصنيفات والأسعار والصور.") },
        { id: ids.step3, enabled: true, title: text("Share with your customers", "شاركها مع زبائنك"), body: text("Generate a QR code or link and start sharing it everywhere.", "أنشئ رمز QR أو رابطًا وابدأ بمشاركته.") },
      ],
    },
    examples: {
      enabled: true,
      eyebrow: text("Beautiful menus", "قوائم جميلة"),
      title: text("Make your menu look amazing.", "اجعل قائمتك تبدو مميزة."),
      description: text("Upload a picture of each menu you want to show.", "ارفع صورة لكل قائمة تريد عرضها."),
      items: [
        { id: ids.modern, enabled: true, imagePath: "", imageAlt: text("Modern menu", "قائمة حديثة"), title: text("Modern", "حديث"), body: text("A bright layout for everyday menus.", "تخطيط فاتح للقوائم اليومية.") },
        { id: ids.minimal, enabled: true, imagePath: "", imageAlt: text("Minimal menu", "قائمة بسيطة"), title: text("Minimal", "بسيط"), body: text("A calm layout with room for photos.", "تخطيط هادئ يترك مساحة للصور.") },
        { id: ids.dark, enabled: true, imagePath: "", imageAlt: text("Dark menu", "قائمة داكنة"), title: text("Dark", "داكن"), body: text("A dark layout for evening service.", "تخطيط داكن مناسب للخدمة المسائية.") },
      ],
    },
    pricing: {
      enabled: true,
      eyebrow: text("Simple pricing", "أسعار واضحة"),
      title: text("Plans for every stage.", "خطط لكل مرحلة."),
      description: text("Prices, limits, and billing periods come from the live plans. Start free and upgrade when you need higher limits.", "الأسعار والحدود وفترة الفوترة تأتي من الخطط الفعلية. ابدأ بالمجان ورقِّ عندما تحتاج حدودًا أعلى."),
      cards: [
        { code: "free", visible: true, badge: text("", ""), blurb: text("", ""), features: [], cta: text("Get started", "ابدأ الآن") },
        { code: "starter", visible: true, badge: text("", ""), blurb: text("", ""), features: [], cta: text("Choose plan", "اختر الخطة") },
        { code: "pro", visible: true, badge: text("Most popular", "الأكثر طلبًا"), blurb: text("", ""), features: [], cta: text("Choose plan", "اختر الخطة") },
      ],
    },
    testimonials: {
      enabled: false,
      title: text("What businesses say", "ماذا تقول الأعمال"),
      items: [],
    },
    faq: {
      enabled: true,
      title: text("Frequently asked questions.", "الأسئلة الشائعة."),
      items: [
        { id: ids.faq1, enabled: true, question: text("Do customers need an app to view my menu?", "هل يحتاج الزبائن إلى تطبيق لمشاهدة قائمتي؟"), answer: text("No. Customers open the menu in their browser from a link or QR code.", "لا. يفتح الزبائن القائمة في المتصفح عبر رابط أو رمز QR.") },
        { id: ids.faq2, enabled: true, question: text("Can I customize the design?", "هل يمكنني تخصيص التصميم؟"), answer: text("Yes. Choose a menu theme and adjust colors and layout from your dashboard.", "نعم. اختر ثيم القائمة وعدّل الألوان والتخطيط من لوحة التحكم.") },
        { id: ids.faq3, enabled: true, question: text("Is there a free plan?", "هل توجد خطة مجانية؟"), answer: text("Yes. The Free plan is available without a payment. Paid plans stay optional.", "نعم. الخطة المجانية متاحة دون دفعة. الخطط المدفوعة اختيارية.") },
        { id: ids.faq4, enabled: true, question: text("Can I use my own domain?", "هل يمكنني استخدام نطاقي؟"), answer: text("Custom domains are available on plans that include that feature.", "النطاق الخاص متاح في الخطط التي تتضمن هذه الميزة.") },
        { id: ids.faq5, enabled: true, question: text("Can I manage multiple locations?", "هل يمكنني إدارة عدة فروع؟"), answer: text("Yes, up to the location limit on your current plan.", "نعم، حتى حد الفروع في خطتك الحالية.") },
        { id: ids.faq6, enabled: true, question: text("Can I change my plan later?", "هل يمكنني تغيير الخطة لاحقًا؟"), answer: text("Yes. You can choose another plan from billing. A paid plan starts after payment is confirmed.", "نعم. يمكنك اختيار خطة أخرى من الفوترة. تبدأ الخطة المدفوعة بعد تأكيد الدفع.") },
      ],
    },
    cta: {
      enabled: true,
      title: text("Create your digital menu today.", "أنشئ قائمتك الرقمية اليوم."),
      description: text("Join businesses using Menor to create and share beautiful digital menus.", "انضم إلى الأعمال التي تستخدم مينور لإنشاء قوائم رقمية جميلة ومشاركتها."),
      label: text("Create account", "إنشاء حساب"),
    },
    footer: {
      enabled: true,
      description: text("Digital menus for restaurants and multi-location businesses.", "قوائم رقمية للمطاعم والأعمال متعددة الفروع."),
      links: [
        { id: ids.linkFeatures, enabled: true, label: text("Features", "المزايا"), kind: "section" as const, href: "#features" },
        { id: ids.linkPricing, enabled: true, label: text("Pricing", "الأسعار"), kind: "section" as const, href: "#pricing" },
        { id: ids.linkHow, enabled: true, label: text("How it works", "كيف يعمل"), kind: "section" as const, href: "#how-it-works" },
        { id: ids.linkFaq, enabled: true, label: text("FAQ", "الأسئلة"), kind: "section" as const, href: "#faq" },
        { id: ids.linkPrivacy, enabled: false, label: text("Privacy Policy", "سياسة الخصوصية"), kind: "section" as const, href: "" },
        { id: ids.linkTerms, enabled: false, label: text("Terms of Service", "شروط الخدمة"), kind: "section" as const, href: "" },
        { id: ids.linkSupport, enabled: false, label: text("Support", "الدعم"), kind: "section" as const, href: "" },
      ],
    },
    site: {
      name: text("", ""),
      logoPath: "",
    },
    contact: {
      email: "",
      phone: "",
      address: text("", ""),
      supportUrl: "",
      socials: socialNetworks.map((network) => ({ network, enabled: false, url: "" })),
    },
    seo: {
      title: text("Menor · Digital menus", "مينور · قوائم رقمية"),
      description: text("Create a digital menu, share a link or QR code, and update it from your dashboard.", "أنشئ قائمة رقمية، شارك رابطًا أو رمز QR، وحدّثها من لوحة التحكم."),
      ogTitle: text("Menor · Digital menus", "مينور · قوائم رقمية"),
      ogDescription: text("Beautiful digital menus for restaurants and multi-location businesses.", "قوائم رقمية جميلة للمطاعم والأعمال متعددة الفروع."),
      imagePath: "",
      imageAlt: text("Menor digital menu", "قائمة مينور الرقمية"),
      index: true,
    },
  });
}

export function readHomepage(value: unknown): { content: HomepageContent; valid: boolean } {
  const parsed = homepageSchema.safeParse(value);
  if (!parsed.success) {
    return { content: defaultHomepageContent(), valid: false };
  }
  return { content: parsed.data, valid: true };
}

export function sectionTargetVisible(content: HomepageContent, id: FooterTargetId): boolean {
  if (id === "contact") {
    return content.footer.enabled;
  }
  if (id === "hero") {
    return content.hero.enabled;
  }
  if (id === "features") {
    return content.features.enabled && content.features.items.some((item) => item.enabled);
  }
  if (id === "how") {
    return content.how.enabled && content.how.items.some((item) => item.enabled);
  }
  if (id === "examples") {
    return content.examples.enabled && content.examples.items.some((item) => item.enabled);
  }
  if (id === "pricing") {
    return content.pricing.enabled;
  }
  if (id === "testimonials") {
    return content.testimonials.enabled && content.testimonials.items.some((item) => item.enabled && item.quote.en.trim().length + item.quote.ar.trim().length > 0);
  }
  if (id === "faq") {
    return content.faq.enabled && content.faq.items.some((item) => item.enabled);
  }
  return content.cta.enabled;
}

export function localizedText(value: LocalizedText, locale: Locale): string {
  const chosen = value[locale].trim();
  if (chosen) {
    return chosen;
  }
  return value[locale === "en" ? "ar" : "en"].trim();
}

export function isSafePublicHref(value: string): boolean {
  if (value.startsWith("#")) {
    return /^#[a-z0-9-]+$/.test(value);
  }
  if (value.startsWith("/")) {
    return !value.startsWith("//") && !value.includes("..") && !value.includes("\\");
  }
  if (value.startsWith("mailto:")) {
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function mergePlanCards(content: HomepageContent, plans: PublicPlan[]): HomepageContent {
  const known = new Map(content.pricing.cards.map((card) => [card.code, card]));
  const cards = [
    ...content.pricing.cards.filter((card) => plans.some((plan) => plan.code === card.code)),
    ...plans
      .filter((plan) => !known.has(plan.code))
      .map((plan) => ({
        code: plan.code,
        visible: true,
        badge: text("", ""),
        blurb: text("", ""),
        features: [],
        cta: text("", ""),
      })),
  ];
  return { ...content, pricing: { ...content.pricing, cards } };
}

export function blankLocalized(): LocalizedText {
  return text("", "");
}
