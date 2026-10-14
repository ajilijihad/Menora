import {
  ArrowRight,
  BarChart3,
  Check,
  Globe,
  ImageIcon,
  Palette,
  SlidersHorizontal,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { BrandLockup } from "@/components/brand-lockup";
import { signOutAction } from "@/modules/auth/actions";
import type { HomeChrome } from "@/lib/i18n/home-copy";
import { formatMoney } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";
import { homepageImageUrl } from "@/lib/homepage/media";
import {
  hrefForSection,
  isSafePublicHref,
  legacySectionAnchor,
  localizedText,
  sectionAnchors,
  sectionTargetVisible,
  type FeatureIcon,
  type HomepageContent,
  type HomepageSectionId,
  type PublicPlan,
  type SocialNetwork,
} from "@/lib/homepage/schema";

const featureIcon: Record<FeatureIcon, LucideIcon> = {
  zap: Zap,
  palette: Palette,
  sliders: SlidersHorizontal,
  chart: BarChart3,
};

const navTargets = ["features", "pricing", "how", "examples", "faq"] as const;

type LandingPageProps = {
  locale: Locale;
  brand: string;
  dashboardLabel: string;
  logoutLabel: string;
  content: HomepageContent;
  plans: PublicPlan[];
  chrome: HomeChrome;
  qrSvg: string | null;
  signedIn: boolean;
  mediaBase: string | null;
};

export function LandingPage({ locale, brand, dashboardLabel, logoutLabel, content, plans, chrome, qrSvg, signedIn, mediaBase }: LandingPageProps) {
  const accountHref = signedIn ? `/${locale}/dashboard` : `/${locale}/register`;
  const other = locale === "en" ? "ar" : "en";
  const siteName = localizedText(content.site.name, locale).trim() || brand;
  const logoUrl = mediaBase ? homepageImageUrl(mediaBase, content.site.logoPath) : null;
  const visible = content.order.filter((id) => sectionTargetVisible(content, id));
  const paired = visible.includes("faq") && visible.includes("cta");
  const shown = new Set<HomepageSectionId>();

  return (
    <div className="bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href={`/${locale}`} className="text-sm">
            <BrandLockup name={siteName} logoUrl={logoUrl} />
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted lg:flex" aria-label={siteName}>
            {navTargets.map((id) => (
              <a key={id} className="hover:text-foreground" href={hrefForSection(id)}>{localizedText(content.nav[id], locale)}</a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2 sm:gap-3">
            <details className="relative lg:hidden">
              <summary className="cursor-pointer list-none rounded-full border border-line px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">{localizedText(content.nav.features, locale)}</summary>
              <div className="absolute end-0 z-20 mt-2 flex w-48 flex-col rounded-xl border border-line bg-surface p-2 text-sm shadow-[var(--shadow-card)]">
                {navTargets.map((id) => (
                  <a key={id} className="rounded-lg px-2 py-2 hover:bg-surface-muted" href={hrefForSection(id)}>{localizedText(content.nav[id], locale)}</a>
                ))}
                {signedIn ? (
                  <form action={signOutAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <button type="submit" className="w-full rounded-lg px-2 py-2 text-start hover:bg-surface-muted">{logoutLabel}</button>
                  </form>
                ) : null}
              </div>
            </details>
            <Link href={`/${other}`} className="rounded-full px-2 py-1 text-sm text-muted hover:text-foreground">
              {locale === "en" ? "العربية" : "English"}
            </Link>
            {signedIn ? (
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="text-sm font-medium">{logoutLabel}</button>
              </form>
            ) : (
              <Link href={`/${locale}/login`} className="hidden text-sm font-medium sm:inline">
                {localizedText(content.nav.login, locale)}
              </Link>
            )}
            <Link href={accountHref} className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              {signedIn ? dashboardLabel : localizedText(content.nav.register, locale)}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {visible.map((id) => {
          if (shown.has(id)) {
            return null;
          }
          if (paired && (id === "faq" || id === "cta")) {
            shown.add("faq");
            shown.add("cta");
            return (
              <section key="faq-cta" className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] lg:items-center">
                <FaqBlock locale={locale} content={content} />
                <CtaBlock locale={locale} content={content} href={accountHref} />
              </section>
            );
          }
          shown.add(id);
          if (id === "hero") {
            return <Hero key={id} locale={locale} content={content} chrome={chrome} qrSvg={qrSvg} accountHref={accountHref} mediaBase={mediaBase} />;
          }
          if (id === "features") {
            return <Features key={id} locale={locale} content={content} />;
          }
          if (id === "how") {
            return <How key={id} locale={locale} content={content} chrome={chrome} qrSvg={qrSvg} />;
          }
          if (id === "examples") {
            return <Examples key={id} locale={locale} content={content} mediaBase={mediaBase} />;
          }
          if (id === "pricing") {
            return <Pricing key={id} locale={locale} content={content} plans={plans} chrome={chrome} accountHref={accountHref} />;
          }
          if (id === "testimonials") {
            return <Testimonials key={id} locale={locale} content={content} />;
          }
          if (id === "faq") {
            return <section key={id} className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6"><FaqBlock locale={locale} content={content} /></section>;
          }
          return <section key={id} className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"><CtaBlock locale={locale} content={content} href={accountHref} /></section>;
        })}
      </main>

      {content.footer.enabled ? (
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
            <div>
              <BrandLockup name={siteName} logoUrl={logoUrl} />
              <p className="mt-3 text-sm text-muted">{localizedText(content.footer.description, locale)}</p>
            </div>
            <nav className="flex flex-col gap-2 text-sm" aria-label={siteName}>
              {content.footer.links.filter((link) => link.enabled && link.href && isSafePublicHref(link.href)).map((link) => (
                <a key={link.id} href={link.href} className="text-muted hover:text-foreground">{localizedText(link.label, locale)}</a>
              ))}
            </nav>
            <div id="contact" className="scroll-mt-24 text-sm text-muted">
              {content.contact.email ? <a className="block hover:text-foreground" href={`mailto:${content.contact.email}`}>{content.contact.email}</a> : null}
              {content.contact.phone ? <p className="mt-2">{content.contact.phone}</p> : null}
              {localizedText(content.contact.address, locale) ? <p className="mt-2">{localizedText(content.contact.address, locale)}</p> : null}
              {content.contact.supportUrl && isSafePublicHref(content.contact.supportUrl) ? (
                <a className="mt-2 block hover:text-foreground" href={content.contact.supportUrl}>{localizedText(content.footer.links.find((link) => link.href === content.contact.supportUrl)?.label ?? { en: "Support", ar: "الدعم" }, locale)}</a>
              ) : null}
              <div className="mt-3 flex gap-2">
                {content.contact.socials.filter((item) => item.enabled && item.url && isSafePublicHref(item.url)).map((item) => (
                  <a key={item.network} href={item.url} className="inline-flex size-9 items-center justify-center rounded-full border border-line text-foreground hover:bg-surface-muted" aria-label={item.network}>
                    <SocialGlyph network={item.network} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">{chrome.languageLabel}</p>
              <div className="mt-2 flex gap-3 text-sm">
                <Link href="/en" hrefLang="en" className={locale === "en" ? "font-semibold text-brand" : "text-muted"}>English</Link>
                <Link href="/ar" hrefLang="ar" className={locale === "ar" ? "font-semibold text-brand" : "text-muted"}>العربية</Link>
              </div>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function LegacyAnchor({ id }: { id: HomepageSectionId }) {
  const legacy = legacySectionAnchor(id);
  return legacy ? <span id={legacy} className="sr-only" /> : null;
}

function Hero({ locale, content, chrome, qrSvg, accountHref, mediaBase }: { locale: Locale; content: HomepageContent; chrome: HomeChrome; qrSvg: string | null; accountHref: string; mediaBase: string | null }) {
  const image = mediaBase ? homepageImageUrl(mediaBase, content.hero.imagePath) : null;
  const secondary = content.hero.secondaryHref && isSafePublicHref(content.hero.secondaryHref) ? content.hero.secondaryHref : "";
  return (
    <section id={sectionAnchors.hero} className="mx-auto grid w-full max-w-6xl scroll-mt-24 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
      <LegacyAnchor id="hero" />
      <div>
        {localizedText(content.hero.badge, locale) ? <p className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{localizedText(content.hero.badge, locale)}</p> : null}
        <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{localizedText(content.hero.title, locale)}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">{localizedText(content.hero.description, locale)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={accountHref} className="inline-flex h-12 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{localizedText(content.hero.primaryLabel, locale)}</Link>
          {secondary ? <a href={secondary} className="inline-flex h-12 items-center rounded-full border border-line bg-surface px-5 text-sm font-semibold hover:bg-surface-muted">{localizedText(content.hero.secondaryLabel, locale)}</a> : null}
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
          {content.hero.points.map((point, index) => (
            <li key={index} className="inline-flex items-center gap-1.5"><Check className="size-4 text-emerald-600" aria-hidden="true" />{localizedText(point, locale)}</li>
          ))}
        </ul>
      </div>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={localizedText(content.hero.imageAlt, locale)} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[var(--shadow-card)]" />
      ) : (
        <MenuStage chrome={chrome} qrSvg={qrSvg} />
      )}
    </section>
  );
}

function MenuStage({ chrome, qrSvg }: { chrome: HomeChrome; qrSvg: string | null }) {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-br from-orange-100 via-rose-50 to-amber-100 dark:from-orange-950/40 dark:via-rose-950/20 dark:to-amber-950/30" />
      <div className="relative grid grid-cols-[minmax(0,1fr)_9rem] items-end gap-4 p-4 sm:p-6">
        <div className="justify-self-center rounded-[2rem] border-8 border-slate-900 bg-white p-3 shadow-[var(--shadow-card)] dark:border-slate-200 dark:bg-slate-950">
          <div className="w-44 overflow-hidden rounded-[1.3rem] bg-[#fffaf6] p-3 text-slate-900">
            <div className="h-20 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500" />
            <p className="mt-2 text-sm font-semibold">{chrome.sampleMenu}</p>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              {chrome.sampleItems.map((item) => (
                <li key={item} className="flex items-center justify-between rounded-lg bg-white px-2 py-1 shadow-sm">
                  <span>{item}</span>
                  <span className="size-6 rounded-md bg-gradient-to-br from-orange-200 to-rose-300" />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mb-6 rounded-2xl bg-surface p-3 shadow-[var(--shadow-card)]">
          {qrSvg ? <div className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} /> : <div className="aspect-square rounded-lg bg-surface-muted" />}
          <p className="mt-2 text-center text-[11px] font-medium text-muted">{chrome.scanMenu}</p>
        </div>
      </div>
    </div>
  );
}

function Features({ locale, content }: { locale: Locale; content: HomepageContent }) {
  const title = localizedText(content.features.title, locale);
  return (
    <section id={sectionAnchors.features} className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-8 sm:px-6">
      {title ? <h2 className="mb-6 text-3xl font-semibold tracking-tight">{title}</h2> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {content.features.items.filter((item) => item.enabled).map((item) => {
          const Icon = featureIcon[item.icon];
          return (
            <article key={item.id} className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand"><Icon className="size-5" aria-hidden="true" /></span>
              <h3 className="mt-4 text-base font-semibold">{localizedText(item.title, locale)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{localizedText(item.body, locale)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function How({ locale, content, chrome, qrSvg }: { locale: Locale; content: HomepageContent; chrome: HomeChrome; qrSvg: string | null }) {
  return (
    <section id={sectionAnchors.how} className="mx-auto grid w-full max-w-6xl scroll-mt-24 items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
      <LegacyAnchor id="how" />
      <div className="rounded-3xl bg-orange-50/80 p-6 dark:bg-orange-950/20 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{localizedText(content.how.eyebrow, locale)}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">{localizedText(content.how.title, locale)}</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {content.how.items.filter((item) => item.enabled).map((item, index) => (
            <li key={item.id}>
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">{index + 1}</span>
              <h3 className="mt-3 text-sm font-semibold">{localizedText(item.title, locale)}</h3>
              <p className="mt-1 text-sm text-muted">{localizedText(item.body, locale)}</p>
            </li>
          ))}
        </ol>
      </div>
      <MenuStage chrome={chrome} qrSvg={qrSvg} />
    </section>
  );
}

function Examples({ locale, content, mediaBase }: { locale: Locale; content: HomepageContent; mediaBase: string | null }) {
  return (
    <section id={sectionAnchors.examples} className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-8 sm:px-6">
      <LegacyAnchor id="examples" />
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{localizedText(content.examples.eyebrow, locale)}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{localizedText(content.examples.title, locale)}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{localizedText(content.examples.description, locale)}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {content.examples.items.filter((item) => item.enabled).map((item) => {
          const image = mediaBase ? homepageImageUrl(mediaBase, item.imagePath) : null;
          const alt = localizedText(item.imageAlt, locale) || localizedText(item.title, locale);
          return (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={alt} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-surface-muted text-muted">
                  <ImageIcon className="size-8" aria-hidden="true" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold">{localizedText(item.title, locale)}</h3>
                <p className="mt-1 text-sm text-muted">{localizedText(item.body, locale)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Pricing({ locale, content, plans, chrome, accountHref }: { locale: Locale; content: HomepageContent; plans: PublicPlan[]; chrome: HomeChrome; accountHref: string }) {
  const cards = content.pricing.cards
    .map((card) => ({ card, plan: plans.find((plan) => plan.code === card.code) }))
    .filter((item): item is { card: HomepageContent["pricing"]["cards"][number]; plan: PublicPlan } => Boolean(item.plan) && item.card.visible);
  return (
    <section id={sectionAnchors.pricing} className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{localizedText(content.pricing.eyebrow, locale)}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{localizedText(content.pricing.title, locale)}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{localizedText(content.pricing.description, locale)}</p>
      {cards.length === 0 ? <p className="mt-8 text-sm text-muted">{chrome.noPlans}</p> : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ card, plan }) => {
            const badge = localizedText(card.badge, locale);
            const price = formatMoney(plan.amountCents, plan.currency, locale);
            const blurb = localizedText(card.blurb, locale) || plan.description || "";
            const custom = card.features.map((feature) => localizedText(feature, locale)).filter(Boolean);
            const features = custom.length > 0 ? custom : [
              chrome.locations.replace("{count}", String(plan.maxBusinesses)),
              chrome.products.replace("{count}", String(plan.maxProducts)),
              chrome.layouts.replace("{count}", String(plan.maxThemes)),
              ...(plan.customDomains ? [chrome.customDomain] : []),
              chrome.analytics.replace("{count}", String(plan.analyticsRetentionDays)),
            ];
            const label = localizedText(card.cta, locale) || (plan.amountCents === 0 ? chrome.getStarted : chrome.choosePlan);
            return (
              <article key={plan.id} className={`flex flex-col rounded-2xl border bg-surface p-5 shadow-[var(--shadow-card)] ${badge ? "border-brand" : "border-line"}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {badge ? <span className="rounded-full bg-brand px-2 py-1 text-[11px] font-semibold text-white">{badge}</span> : null}
                </div>
                {blurb ? <p className="mt-2 text-sm text-muted">{blurb}</p> : null}
                <p className="mt-4 text-3xl font-semibold">{price || plan.currency}<span className="text-sm font-medium text-muted"> {chrome.perMonth}</span></p>
                <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                  {features.map((feature) => <li key={feature} className="inline-flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />{feature}</li>)}
                </ul>
                <Link href={accountHref} className={`mt-5 inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold ${badge ? "bg-brand text-white hover:bg-brand-hover" : "border border-line hover:bg-surface-muted"}`}>{label}</Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Testimonials({ locale, content }: { locale: Locale; content: HomepageContent }) {
  const items = content.testimonials.items.filter((item) => item.enabled && localizedText(item.quote, locale));
  if (items.length === 0) {
    return null;
  }
  return (
    <section id={sectionAnchors.testimonials} className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-8 sm:px-6">
      <h2 className="text-3xl font-semibold tracking-tight">{localizedText(content.testimonials.title, locale)}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <figure key={item.id} className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
            <blockquote className="text-sm leading-6">“{localizedText(item.quote, locale)}”</blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-semibold">{localizedText(item.name, locale)}</span>
              <span className="mt-0.5 block text-muted">{localizedText(item.role, locale)}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FaqBlock({ locale, content }: { locale: Locale; content: HomepageContent }) {
  return (
    <div id={sectionAnchors.faq} className="scroll-mt-24">
      <h2 className="text-3xl font-semibold tracking-tight">{localizedText(content.faq.title, locale)}</h2>
      <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
        {content.faq.items.filter((item) => item.enabled).map((item) => (
          <details key={item.id} className="group px-4 py-3">
            <summary className="cursor-pointer list-none font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">{localizedText(item.question, locale)}</summary>
            <p className="mt-2 text-sm leading-6 text-muted">{localizedText(item.answer, locale)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

function CtaBlock({ locale, content, href }: { locale: Locale; content: HomepageContent; href: string }) {
  return (
    <div id={sectionAnchors.cta} className="scroll-mt-24 rounded-3xl bg-brand p-6 text-white shadow-[var(--shadow-card)] sm:p-8">
      <LegacyAnchor id="cta" />
      <h2 className="text-2xl font-semibold tracking-tight">{localizedText(content.cta.title, locale)}</h2>
      <p className="mt-2 text-sm text-white/90">{localizedText(content.cta.description, locale)}</p>
      <Link href={href} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        {localizedText(content.cta.label, locale)}
        <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
      </Link>
    </div>
  );
}

function SocialGlyph({ network }: { network: SocialNetwork }) {
  if (network === "youtube") {
    return <span className="text-[10px] font-bold" aria-hidden="true">▶</span>;
  }
  if (network === "linkedin") {
    return <span className="text-xs font-bold" aria-hidden="true">in</span>;
  }
  if (network === "instagram" || network === "facebook" || network === "tiktok" || network === "x") {
    return <span className="text-xs font-bold" aria-hidden="true">{network === "facebook" ? "f" : network === "tiktok" ? "♪" : network === "x" ? "𝕏" : "◎"}</span>;
  }
  return <Globe className="size-4" aria-hidden="true" />;
}
