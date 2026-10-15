"use client";

import {
  ArrowDown,
  ArrowUp,
  BadgeDollarSign,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  ExternalLink,
  Globe,
  Info,
  ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  ListOrdered,
  Mail,
  MapPin,
  MessageSquareQuote,
  PanelBottom,
  Phone,
  Plus,
  Save,
  Search,
  Share2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

import { LandingPage } from "@/components/home/landing-page";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { imageExtension, maxImageBytes } from "@/lib/businesses/media";
import { homepageImageUrl } from "@/lib/homepage/media";
import {
  blankLocalized,
  featureIcons,
  footerLinkKind,
  hrefForSection,
  homepageSectionIds,
  isSafePublicHref,
  normalizeFooterHref,
  sectionIdForHref,
  sectionTargetVisible,
  type FeatureIcon,
  type HomepageContent,
  type FooterTargetId,
  type HomepageSectionId,
  type LocalizedText,
  type PublicPlan,
  type SocialNetwork,
} from "@/lib/homepage/schema";
import type { HomeChrome } from "@/lib/i18n/home-copy";
import { formatMoney } from "@/lib/i18n/format";
import type { HomepageEditorCopy } from "@/lib/i18n/homepage-editor-copy";
import type { Locale } from "@/lib/i18n/locales";
import { removeHomepageImageAction, saveHomepageAction, uploadHomepageImageAction, type HomepageActionCode } from "@/modules/homepage/actions";

type EditorSection = HomepageSectionId | "website" | "footer" | "seo";

const fieldClassName = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const iconFieldClassName = "h-11 w-full rounded-xl border border-line bg-surface ps-10 pe-3 text-sm text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const sectionIcon: Record<EditorSection, LucideIcon> = {
  website: Globe,
  hero: LayoutTemplate,
  features: LayoutGrid,
  how: ListOrdered,
  examples: ImageIcon,
  pricing: BadgeDollarSign,
  testimonials: MessageSquareQuote,
  faq: CircleHelp,
  cta: PanelBottom,
  footer: PanelBottom,
  seo: Search,
};

export function HomepageEditor({
  locale,
  copy,
  initial,
  plans,
  storedValid,
  storageReady,
  mediaBase,
  qrSvg,
  brand,
  dashboardLabel,
  chrome,
}: {
  locale: Locale;
  copy: HomepageEditorCopy;
  initial: HomepageContent;
  plans: PublicPlan[];
  storedValid: boolean;
  storageReady: boolean;
  mediaBase: string | null;
  qrSvg: string | null;
  brand: string;
  dashboardLabel: string;
  chrome: { en: HomeChrome; ar: HomeChrome };
}) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [section, setSection] = useState<EditorSection>("website");
  const [language, setLanguage] = useState<Locale>(locale);
  const [previewLocale, setPreviewLocale] = useState<Locale>(locale);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(storageReady ? (storedValid ? null : copy.invalidStored) : copy.messages.unconfigured);
  const [tone, setTone] = useState<"success" | "error">(storageReady && storedValid ? "success" : "error");
  const dirty = JSON.stringify(content) !== saved;

  useEffect(() => {
    function onLeave(event: BeforeUnloadEvent) {
      if (!dirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function update(recipe: (draft: HomepageContent) => void) {
    setContent((current) => {
      const next = structuredClone(current);
      recipe(next);
      return next;
    });
  }

  async function save() {
    setPending(true);
    setNotice(null);
    const result = await saveHomepageAction(content);
    setPending(false);
    if (!result.ok) {
      setTone("error");
      setNotice(copy.messages[result.code]);
      return;
    }
    setSaved(JSON.stringify(content));
    setTone("success");
    setNotice(copy.saved);
  }

  const sections: Array<{ id: EditorSection; label: string }> = [
    { id: "website", label: copy.sections.website },
    ...content.order.map((id) => ({ id, label: copy.sections[id] })),
    { id: "footer", label: copy.sections.footer },
    { id: "seo", label: copy.sections.seo },
  ];

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:px-6">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-2 lg:flex-col">
          {sections.map((item) => {
            const Icon = sectionIcon[item.id];
            const position = homepageSectionIds.includes(item.id as HomepageSectionId) ? content.order.indexOf(item.id as HomepageSectionId) : -1;
            const selected = section === item.id;
            return (
              <div key={item.id} className={`relative flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 ${selected ? "bg-brand/10 text-brand" : "text-foreground hover:bg-surface-muted"}`}>
                {selected ? <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-brand" aria-hidden="true" /> : null}
                <button type="button" onClick={() => setSection(item.id)} className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-start text-sm font-medium" aria-current={selected ? "true" : undefined}>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </button>
                {position >= 0 ? (
                  <span className="flex">
                    <IconButton quiet label={copy.moveUp} disabled={position === 0} onClick={() => moveSection(position, -1)}><ArrowUp className="size-3.5" /></IconButton>
                    <IconButton quiet label={copy.moveDown} disabled={position === content.order.length - 1} onClick={() => moveSection(position, 1)}><ArrowDown className="size-3.5" /></IconButton>
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted">{copy.description}</p>
            {dirty ? <p className="mt-2 text-sm font-medium text-brand">{copy.unsaved}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link href={`/${locale}`} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              <ExternalLink className="size-4" aria-hidden="true" />
              {copy.viewLive}
            </Link>
            <button type="button" disabled={pending || !dirty} onClick={save} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60">
              <Save className="size-4" aria-hidden="true" />
              {pending ? copy.saving : copy.save}
            </button>
          </div>
        </div>
        {notice ? <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${tone === "success" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`} role="status">{notice}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode("edit")} className={`h-9 rounded-lg px-3 text-sm ${mode === "edit" ? "bg-brand/10 font-medium text-brand" : "text-muted"}`}>{copy.edit}</button>
          <button type="button" onClick={() => setMode("preview")} className={`h-9 rounded-lg px-3 text-sm ${mode === "preview" ? "bg-brand/10 font-medium text-brand" : "text-muted"}`}>{copy.preview}</button>
          {mode === "preview" ? (
            <>
              <button type="button" onClick={() => setPreviewLocale("en")} className="h-9 rounded-lg border border-line bg-surface px-3 text-sm">{copy.english}</button>
              <button type="button" onClick={() => setPreviewLocale("ar")} className="h-9 rounded-lg border border-line bg-surface px-3 text-sm">{copy.arabic}</button>
              <button type="button" onClick={() => setViewport("desktop")} className="h-9 rounded-lg border border-line bg-surface px-3 text-sm">{copy.desktop}</button>
              <button type="button" onClick={() => setViewport("mobile")} className="h-9 rounded-lg border border-line bg-surface px-3 text-sm">{copy.mobile}</button>
            </>
          ) : null}
        </div>
        {mode === "preview" ? (
          <div className={`mt-4 overflow-hidden rounded-2xl border border-line bg-background ${viewport === "mobile" ? "mx-auto max-w-sm" : ""}`} dir={previewLocale === "ar" ? "rtl" : "ltr"}>
            <LandingPage locale={previewLocale} brand={brand} dashboardLabel={dashboardLabel} logoutLabel="" content={content} plans={plans} chrome={chrome[previewLocale]} qrSvg={qrSvg} signedIn={false} mediaBase={mediaBase} />
          </div>
        ) : section === "website" ? (
          <div className="mt-5">
            <WebsiteFields copy={copy} content={content} mediaBase={mediaBase} update={update} onNotice={fail} />
          </div>
        ) : section === "footer" ? (
          <div className="mt-5">
            <FooterFields copy={copy} content={content} update={update} />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
            <LocaleSwitch copy={copy} language={language} onChange={setLanguage} />
            {section === "hero" ? <HeroFields copy={copy} language={language} content={content} mediaBase={mediaBase} update={update} onNotice={fail} /> : null}
            {section === "features" ? <FeatureFields copy={copy} language={language} content={content} update={update} /> : null}
            {section === "how" ? <StepFields copy={copy} language={language} content={content} update={update} /> : null}
            {section === "examples" ? <ExampleFields copy={copy} language={language} content={content} mediaBase={mediaBase} update={update} onNotice={fail} /> : null}
            {section === "pricing" ? <PricingFields copy={copy} language={language} content={content} plans={plans} update={update} /> : null}
            {section === "testimonials" ? <TestimonialFields copy={copy} language={language} content={content} update={update} /> : null}
            {section === "faq" ? <FaqFields copy={copy} language={language} content={content} update={update} /> : null}
            {section === "cta" ? <CtaFields copy={copy} language={language} content={content} update={update} /> : null}
            {section === "seo" ? <SeoFields copy={copy} language={language} content={content} mediaBase={mediaBase} update={update} onNotice={fail} /> : null}
          </div>
        )}
      </div>
    </div>
  );

  function moveSection(index: number, direction: -1 | 1) {
    update((draft) => {
      const next = index + direction;
      const [item] = draft.order.splice(index, 1);
      if (item) {
        draft.order.splice(next, 0, item);
      }
    });
  }

  function fail(code: HomepageActionCode) {
    setTone("error");
    setNotice(copy.messages[code]);
  }
}

function LocaleSwitch({ copy, language, onChange }: { copy: HomepageEditorCopy; language: Locale; onChange: (locale: Locale) => void }) {
  return (
    <div className="mb-4 flex gap-2" role="tablist">
      {(["en", "ar"] as const).map((item) => (
        <button key={item} type="button" role="tab" aria-selected={language === item} onClick={() => onChange(item)} className={`h-9 rounded-lg border px-3 text-sm ${language === item ? "border-brand bg-brand/10 text-brand" : "border-line text-muted"}`}>
          {item === "en" ? copy.english : copy.arabic}
        </button>
      ))}
    </div>
  );
}

function HeroFields({ copy, language, content, mediaBase, update, onNotice }: { copy: HomepageEditorCopy; language: Locale; content: HomepageContent; mediaBase: string | null; update: (recipe: (draft: HomepageContent) => void) => void; onNotice: (code: HomepageActionCode) => void }) {
  return (
    <div className="grid gap-4">
      <Toggle label={copy.enabled} checked={content.hero.enabled} onChange={(checked) => update((draft) => { draft.hero.enabled = checked; })} />
      <Pair label={copy.fields.badge} value={content.hero.badge} language={language} onChange={(value) => update((draft) => { draft.hero.badge[language] = value; })} />
      <Pair label={copy.fields.title} value={content.hero.title} language={language} onChange={(value) => update((draft) => { draft.hero.title[language] = value; })} />
      <Area label={copy.fields.description} value={content.hero.description[language]} onChange={(value) => update((draft) => { draft.hero.description[language] = value; })} />
      <Pair label={copy.fields.primary} value={content.hero.primaryLabel} language={language} onChange={(value) => update((draft) => { draft.hero.primaryLabel[language] = value; })} />
      <Pair label={copy.fields.secondary} value={content.hero.secondaryLabel} language={language} onChange={(value) => update((draft) => { draft.hero.secondaryLabel[language] = value; })} />
      <Field label={copy.fields.secondaryHref}><input className={fieldClassName} value={content.hero.secondaryHref} onChange={(event) => update((draft) => { draft.hero.secondaryHref = event.target.value; })} /></Field>
      {content.hero.points.map((point, index) => (
        <Pair key={index} label={`${copy.fields.badge} ${index + 1}`} value={point} language={language} onChange={(value) => update((draft) => { const current = draft.hero.points[index]; if (current) current[language] = value; })} />
      ))}
      <Pair label={copy.alt} value={content.hero.imageAlt} language={language} onChange={(value) => update((draft) => { draft.hero.imageAlt[language] = value; })} />
      <ImageField copy={copy} label={copy.heroImage} path={content.hero.imagePath} mediaBase={mediaBase} onNotice={onNotice} onPath={(path) => update((draft) => { draft.hero.imagePath = path; })} />
    </div>
  );
}

function FeatureFields({ copy, language, content, update }: { copy: HomepageEditorCopy; language: Locale; content: HomepageContent; update: (recipe: (draft: HomepageContent) => void) => void }) {
  return (
    <ListSection copy={copy} enabled={content.features.enabled} onEnabled={(checked) => update((draft) => { draft.features.enabled = checked; })} onAdd={() => update((draft) => { draft.features.items.push({ id: crypto.randomUUID(), enabled: true, icon: "zap", title: blankLocalized(), body: blankLocalized() }); })}>
      <Pair label={copy.fields.title} value={content.features.title} language={language} onChange={(value) => update((draft) => { draft.features.title[language] = value; })} />
      {content.features.items.map((item, index) => (
        <Entry key={item.id} copy={copy} enabled={item.enabled} onEnabled={(checked) => update((draft) => { const current = draft.features.items[index]; if (current) current.enabled = checked; })} onRemove={() => update((draft) => { draft.features.items.splice(index, 1); })} onUp={() => move(update, (draft) => draft.features.items, index, -1)} onDown={() => move(update, (draft) => draft.features.items, index, 1)} upDisabled={index === 0} downDisabled={index === content.features.items.length - 1}>
          <Field label={copy.fields.icon}>
            <Select
              value={item.icon}
              onValueChange={(next) => update((draft) => { const current = draft.features.items[index]; if (current) current.icon = next as FeatureIcon; })}
              options={featureIcons.map((icon) => ({ value: icon, label: icon }))}
              className={fieldClassName}
            />
          </Field>
          <Pair label={copy.fields.title} value={item.title} language={language} onChange={(value) => update((draft) => { const current = draft.features.items[index]; if (current) current.title[language] = value; })} />
          <Area label={copy.fields.body} value={item.body[language]} onChange={(value) => update((draft) => { const current = draft.features.items[index]; if (current) current.body[language] = value; })} />
        </Entry>
      ))}
    </ListSection>
  );
}

function StepFields({ copy, language, content, update }: { copy: HomepageEditorCopy; language: Locale; content: HomepageContent; update: (recipe: (draft: HomepageContent) => void) => void }) {
  return (
    <ListSection copy={copy} enabled={content.how.enabled} onEnabled={(checked) => update((draft) => { draft.how.enabled = checked; })} onAdd={() => update((draft) => { draft.how.items.push({ id: crypto.randomUUID(), enabled: true, title: blankLocalized(), body: blankLocalized() }); })}>
      <Pair label={copy.fields.eyebrow} value={content.how.eyebrow} language={language} onChange={(value) => update((draft) => { draft.how.eyebrow[language] = value; })} />
      <Pair label={copy.fields.title} value={content.how.title} language={language} onChange={(value) => update((draft) => { draft.how.title[language] = value; })} />
      {content.how.items.map((item, index) => (
        <Entry key={item.id} copy={copy} enabled={item.enabled} onEnabled={(checked) => update((draft) => { const current = draft.how.items[index]; if (current) current.enabled = checked; })} onRemove={() => update((draft) => { draft.how.items.splice(index, 1); })} onUp={() => move(update, (draft) => draft.how.items, index, -1)} onDown={() => move(update, (draft) => draft.how.items, index, 1)} upDisabled={index === 0} downDisabled={index === content.how.items.length - 1}>
          <Pair label={copy.fields.title} value={item.title} language={language} onChange={(value) => update((draft) => { const current = draft.how.items[index]; if (current) current.title[language] = value; })} />
          <Area label={copy.fields.body} value={item.body[language]} onChange={(value) => update((draft) => { const current = draft.how.items[index]; if (current) current.body[language] = value; })} />
        </Entry>
      ))}
    </ListSection>
  );
}

function ExampleFields({ copy, language, content, mediaBase, update, onNotice }: { copy: HomepageEditorCopy; language: Locale; content: HomepageContent; mediaBase: string | null; update: (recipe: (draft: HomepageContent) => void) => void; onNotice: (code: HomepageActionCode) => void }) {
  return (
    <ListSection copy={copy} enabled={content.examples.enabled} onEnabled={(checked) => update((draft) => { draft.examples.enabled = checked; })} onAdd={() => update((draft) => { draft.examples.items.push({ id: crypto.randomUUID(), enabled: true, imagePath: "", imageAlt: blankLocalized(), title: blankLocalized(), body: blankLocalized() }); })}>
      <Pair label={copy.fields.eyebrow} value={content.examples.eyebrow} language={language} onChange={(value) => update((draft) => { draft.examples.eyebrow[language] = value; })} />
      <Pair label={copy.fields.title} value={content.examples.title} language={language} onChange={(value) => update((draft) => { draft.examples.title[language] = value; })} />
      <Area label={copy.fields.description} value={content.examples.description[language]} onChange={(value) => update((draft) => { draft.examples.description[language] = value; })} />
      {content.examples.items.map((item, index) => (
        <Entry key={item.id} copy={copy} enabled={item.enabled} onEnabled={(checked) => update((draft) => { const current = draft.examples.items[index]; if (current) current.enabled = checked; })} onRemove={() => { if (item.imagePath) void removeHomepageImageAction(item.imagePath); update((draft) => { draft.examples.items.splice(index, 1); }); }} onUp={() => move(update, (draft) => draft.examples.items, index, -1)} onDown={() => move(update, (draft) => draft.examples.items, index, 1)} upDisabled={index === 0} downDisabled={index === content.examples.items.length - 1}>
          <ImageField copy={copy} label={copy.fields.theme} path={item.imagePath} mediaBase={mediaBase} onNotice={onNotice} onPath={(path) => update((draft) => { const current = draft.examples.items[index]; if (current) current.imagePath = path; })} />
          <Pair label={copy.alt} value={item.imageAlt} language={language} onChange={(value) => update((draft) => { const current = draft.examples.items[index]; if (current) current.imageAlt[language] = value; })} />
          <Pair label={copy.fields.title} value={item.title} language={language} onChange={(value) => update((draft) => { const current = draft.examples.items[index]; if (current) current.title[language] = value; })} />
          <Area label={copy.fields.body} value={item.body[language]} onChange={(value) => update((draft) => { const current = draft.examples.items[index]; if (current) current.body[language] = value; })} />
        </Entry>
      ))}
    </ListSection>
  );
}

function PricingFields({ copy, language, content, plans, update }: { copy: HomepageEditorCopy; language: Locale; content: HomepageContent; plans: PublicPlan[]; update: (recipe: (draft: HomepageContent) => void) => void }) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted">{copy.priceNote}</p>
      <Toggle label={copy.enabled} checked={content.pricing.enabled} onChange={(checked) => update((draft) => { draft.pricing.enabled = checked; })} />
      <Pair label={copy.fields.eyebrow} value={content.pricing.eyebrow} language={language} onChange={(value) => update((draft) => { draft.pricing.eyebrow[language] = value; })} />
      <Pair label={copy.fields.title} value={content.pricing.title} language={language} onChange={(value) => update((draft) => { draft.pricing.title[language] = value; })} />
      <Area label={copy.fields.description} value={content.pricing.description[language]} onChange={(value) => update((draft) => { draft.pricing.description[language] = value; })} />
      {content.pricing.cards.map((card, index) => {
        const plan = plans.find((item) => item.code === card.code);
        return (
          <Entry key={card.code} copy={copy} enabled={card.visible} enabledLabel={copy.enabled} onEnabled={(checked) => update((draft) => { const current = draft.pricing.cards[index]; if (current) current.visible = checked; })} onRemove={() => undefined} onUp={() => move(update, (draft) => draft.pricing.cards, index, -1)} onDown={() => move(update, (draft) => draft.pricing.cards, index, 1)} upDisabled={index === 0} downDisabled={index === content.pricing.cards.length - 1} hideRemove>
            <p className="text-sm font-semibold">{plan?.name ?? card.code}{plan ? ` · ${formatMoney(plan.amountCents, plan.currency, language) || plan.currency}` : ""}</p>
            <Pair label={copy.fields.badgePlan} value={card.badge} language={language} onChange={(value) => update((draft) => { const current = draft.pricing.cards[index]; if (current) current.badge[language] = value; })} />
            <Area label={copy.fields.blurb} value={card.blurb[language]} onChange={(value) => update((draft) => { const current = draft.pricing.cards[index]; if (current) current.blurb[language] = value; })} />
            <Pair label={copy.fields.cta} value={card.cta} language={language} onChange={(value) => update((draft) => { const current = draft.pricing.cards[index]; if (current) current.cta[language] = value; })} />
            {card.features.map((feature, featureIndex) => (
              <div key={featureIndex} className="flex items-end gap-2">
                <div className="min-w-0 flex-1"><Pair label={copy.fields.feature} value={feature} language={language} onChange={(value) => update((draft) => { const current = draft.pricing.cards[index]?.features[featureIndex]; if (current) current[language] = value; })} /></div>
                <IconButton label={copy.remove} onClick={() => update((draft) => { draft.pricing.cards[index]?.features.splice(featureIndex, 1); })}><Trash2 className="size-4" /></IconButton>
              </div>
            ))}
            <button type="button" className="text-sm font-medium text-brand" onClick={() => update((draft) => { draft.pricing.cards[index]?.features.push(blankLocalized()); })}>{copy.add}</button>
          </Entry>
        );
      })}
    </div>
  );
}

function TestimonialFields({ copy, language, content, update }: { copy: HomepageEditorCopy; language: Locale; content: HomepageContent; update: (recipe: (draft: HomepageContent) => void) => void }) {
  return (
    <ListSection copy={copy} enabled={content.testimonials.enabled} onEnabled={(checked) => update((draft) => { draft.testimonials.enabled = checked; })} onAdd={() => update((draft) => { draft.testimonials.items.push({ id: crypto.randomUUID(), enabled: true, name: blankLocalized(), role: blankLocalized(), quote: blankLocalized() }); })}>
      <p className="text-sm text-muted">{copy.testimonialsEmpty}</p>
      <Pair label={copy.fields.title} value={content.testimonials.title} language={language} onChange={(value) => update((draft) => { draft.testimonials.title[language] = value; })} />
      {content.testimonials.items.length === 0 ? <p className="text-sm text-muted">{copy.empty}</p> : null}
      {content.testimonials.items.map((item, index) => (
        <Entry key={item.id} copy={copy} enabled={item.enabled} onEnabled={(checked) => update((draft) => { const current = draft.testimonials.items[index]; if (current) current.enabled = checked; })} onRemove={() => update((draft) => { draft.testimonials.items.splice(index, 1); })} onUp={() => move(update, (draft) => draft.testimonials.items, index, -1)} onDown={() => move(update, (draft) => draft.testimonials.items, index, 1)} upDisabled={index === 0} downDisabled={index === content.testimonials.items.length - 1}>
          <Pair label={copy.fields.name} value={item.name} language={language} onChange={(value) => update((draft) => { const current = draft.testimonials.items[index]; if (current) current.name[language] = value; })} />
          <Pair label={copy.fields.role} value={item.role} language={language} onChange={(value) => update((draft) => { const current = draft.testimonials.items[index]; if (current) current.role[language] = value; })} />
          <Area label={copy.fields.quote} value={item.quote[language]} onChange={(value) => update((draft) => { const current = draft.testimonials.items[index]; if (current) current.quote[language] = value; })} />
        </Entry>
      ))}
    </ListSection>
  );
}

function FaqFields({ copy, language, content, update }: { copy: HomepageEditorCopy; language: Locale; content: HomepageContent; update: (recipe: (draft: HomepageContent) => void) => void }) {
  return (
    <ListSection copy={copy} enabled={content.faq.enabled} onEnabled={(checked) => update((draft) => { draft.faq.enabled = checked; })} onAdd={() => update((draft) => { draft.faq.items.push({ id: crypto.randomUUID(), enabled: true, question: blankLocalized(), answer: blankLocalized() }); })}>
      <Pair label={copy.fields.title} value={content.faq.title} language={language} onChange={(value) => update((draft) => { draft.faq.title[language] = value; })} />
      {content.faq.items.map((item, index) => (
        <Entry key={item.id} copy={copy} enabled={item.enabled} onEnabled={(checked) => update((draft) => { const current = draft.faq.items[index]; if (current) current.enabled = checked; })} onRemove={() => update((draft) => { draft.faq.items.splice(index, 1); })} onUp={() => move(update, (draft) => draft.faq.items, index, -1)} onDown={() => move(update, (draft) => draft.faq.items, index, 1)} upDisabled={index === 0} downDisabled={index === content.faq.items.length - 1}>
          <Pair label={copy.fields.question} value={item.question} language={language} onChange={(value) => update((draft) => { const current = draft.faq.items[index]; if (current) current.question[language] = value; })} />
          <Area label={copy.fields.answer} value={item.answer[language]} onChange={(value) => update((draft) => { const current = draft.faq.items[index]; if (current) current.answer[language] = value; })} />
        </Entry>
      ))}
    </ListSection>
  );
}

function CtaFields({ copy, language, content, update }: { copy: HomepageEditorCopy; language: Locale; content: HomepageContent; update: (recipe: (draft: HomepageContent) => void) => void }) {
  return (
    <div className="grid gap-4">
      <Toggle label={copy.enabled} checked={content.cta.enabled} onChange={(checked) => update((draft) => { draft.cta.enabled = checked; })} />
      <Pair label={copy.fields.title} value={content.cta.title} language={language} onChange={(value) => update((draft) => { draft.cta.title[language] = value; })} />
      <Area label={copy.fields.description} value={content.cta.description[language]} onChange={(value) => update((draft) => { draft.cta.description[language] = value; })} />
      <Pair label={copy.fields.cta} value={content.cta.label} language={language} onChange={(value) => update((draft) => { draft.cta.label[language] = value; })} />
    </div>
  );
}

function WebsiteFields({ copy, content, mediaBase, update, onNotice }: { copy: HomepageEditorCopy; content: HomepageContent; mediaBase: string | null; update: (recipe: (draft: HomepageContent) => void) => void; onNotice: (code: HomepageActionCode) => void }) {
  return (
    <div className="grid gap-4">
      <EditorCard icon={<Globe className="size-4" aria-hidden="true" />} iconClassName="bg-brand/10 text-brand" title={copy.websiteInfo} description={copy.websiteInfoHint}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={copy.fields.siteNameEn} required>
            <input dir="ltr" className={fieldClassName} maxLength={80} value={content.site.name.en} onChange={(event) => update((draft) => { draft.site.name.en = event.target.value; })} />
          </Field>
          <Field label={copy.fields.siteNameAr} required dir="rtl">
            <input dir="rtl" className={fieldClassName} maxLength={80} value={content.site.name.ar} onChange={(event) => update((draft) => { draft.site.name.ar = event.target.value; })} />
          </Field>
        </div>
      </EditorCard>
      <EditorCard title={copy.logoTitle} description={copy.logoHint}>
        <LogoField copy={copy} path={content.site.logoPath} mediaBase={mediaBase} onNotice={onNotice} onPath={(path) => update((draft) => { draft.site.logoPath = path; })} />
      </EditorCard>
      <EditorCard icon={<Phone className="size-4" aria-hidden="true" />} iconClassName="bg-brand/10 text-brand" title={copy.contactTitle} description={copy.contactHint}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={copy.fields.email}>
            <IconInput icon={<Mail className="size-4" aria-hidden="true" />}>
              <input dir="ltr" type="email" autoComplete="email" className={iconFieldClassName} value={content.contact.email} onChange={(event) => update((draft) => { draft.contact.email = event.target.value; })} />
            </IconInput>
          </Field>
          <Field label={copy.fields.phone}>
            <IconInput icon={<Phone className="size-4" aria-hidden="true" />}>
              <input dir="ltr" type="tel" autoComplete="tel" className={iconFieldClassName} value={content.contact.phone} onChange={(event) => update((draft) => { draft.contact.phone = event.target.value; })} />
            </IconInput>
          </Field>
          <Field label={copy.fields.support}>
            <IconInput icon={<Link2 className="size-4" aria-hidden="true" />}>
              <input dir="ltr" type="url" inputMode="url" placeholder="https://" autoComplete="url" className={iconFieldClassName} value={content.contact.supportUrl} onChange={(event) => update((draft) => { draft.contact.supportUrl = event.target.value; })} />
            </IconInput>
          </Field>
          <div className="hidden md:block" />
          <Field label={copy.fields.locationEn}>
            <IconInput icon={<MapPin className="size-4" aria-hidden="true" />} dir="ltr">
              <input dir="ltr" autoComplete="street-address" className={iconFieldClassName} maxLength={200} value={content.contact.address.en} onChange={(event) => update((draft) => { draft.contact.address.en = event.target.value; })} />
            </IconInput>
          </Field>
          <Field label={copy.fields.locationAr} dir="rtl">
            <IconInput icon={<MapPin className="size-4" aria-hidden="true" />} dir="rtl">
              <input dir="rtl" autoComplete="street-address" className={iconFieldClassName} maxLength={200} value={content.contact.address.ar} onChange={(event) => update((draft) => { draft.contact.address.ar = event.target.value; })} />
            </IconInput>
          </Field>
        </div>
      </EditorCard>
      <EditorCard icon={<Share2 className="size-4" aria-hidden="true" />} iconClassName="bg-violet-500/10 text-violet-600" title={copy.socials} description={copy.socialHint}>
        <div className="grid gap-3 md:grid-cols-2">
          {content.contact.socials.map((item, index) => (
            <div key={item.network} className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap">
              <Checkbox checked={item.enabled} ariaLabel={copy.networks[item.network]} onCheckedChange={(checked) => update((draft) => { const current = draft.contact.socials[index]; if (current) current.enabled = checked; })} />
              <SocialBrand network={item.network} />
              <span className="w-24 shrink-0 text-sm font-medium text-foreground">{copy.networks[item.network]}</span>
              <input dir="ltr" type="url" inputMode="url" placeholder="https://" autoComplete="url" className={`${fieldClassName} min-w-[10rem] flex-1`} value={item.url} onChange={(event) => update((draft) => { const current = draft.contact.socials[index]; if (current) current.url = event.target.value; })} />
            </div>
          ))}
        </div>
      </EditorCard>
    </div>
  );
}

function EditorCard({ icon, iconClassName, title, description, children }: { icon?: ReactNode; iconClassName?: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-start gap-3">
        {icon ? <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${iconClassName ?? "bg-surface-muted text-foreground"}`}>{icon}</span> : null}
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function IconInput({ icon, dir, children }: { icon: ReactNode; dir?: "ltr" | "rtl"; children: ReactNode }) {
  return (
    <span className="relative block" dir={dir}>
      <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
      {children}
    </span>
  );
}

function LogoField({ copy, path, mediaBase, onPath, onNotice }: { copy: HomepageEditorCopy; path: string; mediaBase: string | null; onPath: (path: string) => void; onNotice: (code: HomepageActionCode) => void }) {
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const src = mediaBase ? homepageImageUrl(mediaBase, path) : null;

  async function upload(file: File) {
    if (!imageExtension(file.type)) {
      onNotice("image_type");
      return;
    }
    if (file.size > maxImageBytes) {
      onNotice("image_too_large");
      return;
    }
    setUploading(true);
    const data = new FormData();
    data.set("file", file);
    const result = await uploadHomepageImageAction(data);
    if (!result.ok) {
      setUploading(false);
      onNotice(result.code);
      return;
    }
    if (path) {
      await removeHomepageImageAction(path);
    }
    onPath(result.path);
    setUploading(false);
  }

  async function remove() {
    setConfirming(false);
    const result = await removeHomepageImageAction(path);
    if (!result.ok) {
      onNotice(result.code);
      return;
    }
    onPath("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-muted">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="size-full object-contain" />
          ) : (
            <ImageIcon className="size-5 text-muted" aria-hidden="true" />
          )}
        </span>
        <label className={`inline-flex h-10 cursor-pointer items-center rounded-xl border border-line bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-muted focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          {copy.changeLogo}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              void upload(file);
            }
          }} />
        </label>
        <button type="button" aria-label={copy.removeImage} disabled={!path || uploading} onClick={() => setConfirming(true)} className="inline-flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 disabled:opacity-40 dark:bg-rose-950/40 dark:text-rose-300">
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">{copy.imageHint}</p>
      {confirming ? <ConfirmPopup copy={copy} onCancel={() => setConfirming(false)} onConfirm={() => { void remove(); }} /> : null}
    </div>
  );
}

function SocialBrand({ network }: { network: SocialNetwork }) {
  const tone: Record<SocialNetwork, string> = {
    instagram: "text-pink-500",
    facebook: "text-blue-600",
    tiktok: "text-foreground",
    x: "text-foreground",
    linkedin: "text-sky-700",
    youtube: "text-red-600",
  };
  const paths: Record<SocialNetwork, string> = {
    instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm6.2-.9a1 1 0 1 0 1 1 1 1 0 0 0-1-1z",
    facebook: "M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z",
    tiktok: "M14 4v10.2a3.2 3.2 0 1 1-2.5-3.1V14a1.7 1.7 0 1 0 1.2 1.6V4h1.3a5.2 5.2 0 0 0 3.5 1.8V7.2A6.8 6.8 0 0 1 14 6.2V4z",
    x: "M6 5h3.2l2.6 3.6L14.8 5H18l-4.4 5.7L18.2 19h-3.2l-2.9-4-3.2 4H5.6l4.7-6.1L6 5z",
    linkedin: "M6.5 9H9v9H6.5zM7.8 5.2A1.6 1.6 0 1 1 6.2 6.8a1.6 1.6 0 0 1 1.6-1.6zM11 9h2.4v1.2h.1c.3-.6 1.2-1.3 2.5-1.3 2.7 0 3.2 1.8 3.2 4.1V18H16.8v-4.5c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4V18H11z",
    youtube: "M22 12.2s0-3.2-.4-4.6a3 3 0 0 0-2.1-2.1C17.9 5 12 5 12 5s-5.9 0-7.5.5a3 3 0 0 0-2.1 2.1C2 9 2 12.2 2 12.2s0 3.2.4 4.6a3 3 0 0 0 2.1 2.1C6.1 19.4 12 19.4 12 19.4s5.9 0 7.5-.5a3 3 0 0 0 2.1-2.1c.4-1.4.4-4.6.4-4.6zM10 15.5v-6.6l5.2 3.3z",
  };
  return (
    <svg viewBox="0 0 24 24" className={`size-4 shrink-0 fill-current ${tone[network]}`} aria-hidden="true">
      <path d={paths[network]} />
    </svg>
  );
}

const footerTargets: FooterTargetId[] = [...homepageSectionIds, "contact"];

function targetLabel(copy: HomepageEditorCopy, id: FooterTargetId): string {
  return id === "contact" ? copy.footerLinks.contactSection : copy.sections[id];
}

function FooterFields({ copy, content, update }: { copy: HomepageEditorCopy; content: HomepageContent; update: (recipe: (draft: HomepageContent) => void) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const links = copy.footerLinks;
  const full = content.footer.links.length >= 10;

  function add(kind: "section" | "external") {
    if (full) {
      return;
    }
    setMenuOpen(false);
    update((draft) => {
      draft.footer.links.push({
        id: crypto.randomUUID(),
        enabled: true,
        label: blankLocalized(),
        kind,
        href: kind === "section" ? hrefForSection(draft.order[0] ?? "hero") : "",
      });
    });
  }

  async function copyHref(id: string, href: string) {
    if (!href) {
      return;
    }
    try {
      await navigator.clipboard.writeText(href);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><Link2 className="size-4" aria-hidden="true" /></span>
          <div>
            <h2 className="text-base font-semibold text-foreground">{links.title}</h2>
            <p className="mt-0.5 text-sm text-muted">{links.hint}</p>
          </div>
        </div>
        <div className="relative self-start">
          <button type="button" disabled={full} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60">
            <Plus className="size-4" aria-hidden="true" />
            {links.addLink}
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div className="absolute end-0 z-20 mt-2 w-72 rounded-xl border border-line bg-surface p-1.5 shadow-[var(--shadow-card)]">
              <button type="button" className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-start hover:bg-surface-muted" onClick={() => add("section")}>
                <Link2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                <span><span className="block text-sm font-medium text-foreground">{links.addSection}</span><span className="block text-xs text-muted">{links.addSectionHint}</span></span>
              </button>
              <button type="button" className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-start hover:bg-surface-muted" onClick={() => add("external")}>
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                <span><span className="block text-sm font-medium text-foreground">{links.addExternal}</span><span className="block text-xs text-muted">{links.addExternalHint}</span></span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <Toggle label={copy.enabled} checked={content.footer.enabled} onChange={(checked) => update((draft) => { draft.footer.enabled = checked; })} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Area label={links.descriptionEn} dir="ltr" value={content.footer.description.en} onChange={(value) => update((draft) => { draft.footer.description.en = value; })} />
        <Area label={links.descriptionAr} dir="rtl" value={content.footer.description.ar} onChange={(value) => update((draft) => { draft.footer.description.ar = value; })} />
      </div>
      <div className="mt-4 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm dark:border-sky-900 dark:bg-sky-950/30">
        <Info className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden="true" />
        <div>
          <p className="font-medium text-foreground">{links.autoTitle}</p>
          <p className="text-muted">{links.autoHint}</p>
        </div>
      </div>
      <div className="mt-4 hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-start text-xs font-medium text-muted">
              <th className="px-2 py-2 text-start font-medium">#</th>
              <th className="px-2 py-2 text-start font-medium">{links.show}</th>
              <th className="px-2 py-2 text-start font-medium">{links.labelEn}</th>
              <th className="px-2 py-2 text-start font-medium">{links.labelAr}</th>
              <th className="px-2 py-2 text-start font-medium">{links.linkType}</th>
              <th className="px-2 py-2 text-start font-medium">{links.destination}</th>
              <th className="px-2 py-2 text-start font-medium">{links.preview}</th>
              <th className="px-2 py-2 text-start font-medium">{links.actions}</th>
            </tr>
          </thead>
          <tbody>
            {content.footer.links.map((link, index) => (
              <FooterLinkRow key={link.id} layout="row" index={index} link={link} copy={copy} content={content} copied={copiedId === link.id} update={update} onCopy={(href) => { void copyHref(link.id, href); }} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 lg:hidden">
        {content.footer.links.map((link, index) => (
          <FooterLinkRow key={link.id} layout="card" index={index} link={link} copy={copy} content={content} copied={copiedId === link.id} update={update} onCopy={(href) => { void copyHref(link.id, href); }} />
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600"><Link2 className="size-4" aria-hidden="true" /></span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{links.availableTitle}</h3>
            <p className="mt-0.5 text-sm text-muted">{links.availableHint}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {footerTargets.map((id) => (
            <span key={id} className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs">
              <span className="font-medium text-foreground">{targetLabel(copy, id)}</span>
              <span className="font-mono text-muted">{hrefForSection(id)}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterLinkRow({ layout, index, link, copy, content, copied, update, onCopy }: { layout: "row" | "card"; index: number; link: HomepageContent["footer"]["links"][number]; copy: HomepageEditorCopy; content: HomepageContent; copied: boolean; update: (recipe: (draft: HomepageContent) => void) => void; onCopy: (href: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const links = copy.footerLinks;
  const kind = footerLinkKind(link.href, link.kind);
  const preview = kind === "section" ? normalizeFooterHref(link.href, "section") : link.href;
  const target = sectionIdForHref(link.href);
  const found = kind === "external" ? isSafePublicHref(link.href) : Boolean(target && sectionTargetVisible(content, target));
  const status = kind === "external" ? (found ? links.externalOk : links.externalInvalid) : (found ? links.sectionFound : links.sectionMissing);
  const last = index === content.footer.links.length - 1;

  function setKind(next: "section" | "external") {
    update((draft) => {
      const current = draft.footer.links[index];
      if (!current) return;
      current.kind = next;
      if (next === "section" && !sectionIdForHref(current.href)) {
        current.href = hrefForSection(draft.order[0] ?? "hero");
      }
      if (next === "external" && current.href.startsWith("#")) {
        current.href = "";
      }
    });
  }

  const show = <Checkbox checked={link.enabled} ariaLabel={links.show} onCheckedChange={(checked) => update((draft) => { const current = draft.footer.links[index]; if (current) current.enabled = checked; })} />;
  const labelEn = <input dir="ltr" className={fieldClassName} maxLength={40} value={link.label.en} aria-label={links.labelEn} onChange={(event) => update((draft) => { const current = draft.footer.links[index]; if (current) current.label.en = event.target.value; })} />;
  const labelAr = <input dir="rtl" className={fieldClassName} maxLength={40} value={link.label.ar} aria-label={links.labelAr} onChange={(event) => update((draft) => { const current = draft.footer.links[index]; if (current) current.label.ar = event.target.value; })} />;
  const type = (
    <Select
      ariaLabel={links.linkType}
      value={kind}
      onValueChange={(next) => setKind(next === "external" ? "external" : "section")}
      options={[{ value: "section", label: links.pageSection }, { value: "external", label: links.externalUrl }]}
      className={fieldClassName}
    />
  );
  const destination = kind === "section" ? (
    <Select
      ariaLabel={links.destination}
      value={target ?? ""}
      onValueChange={(next) => update((draft) => { const current = draft.footer.links[index]; if (!current) return; current.kind = "section"; current.href = hrefForSection(next as FooterTargetId); })}
      options={[{ value: "", label: links.destination, disabled: true }, ...footerTargets.map((id) => ({ value: id, label: targetLabel(copy, id) }))]}
      className={fieldClassName}
    />
  ) : (
    <input dir="ltr" type="url" inputMode="url" placeholder="https://" className={fieldClassName} aria-label={links.destination} value={link.href} onChange={(event) => update((draft) => { const current = draft.footer.links[index]; if (!current) return; current.kind = "external"; current.href = event.target.value; })} />
  );
  const previewField = (
    <div>
      <div className="flex items-center gap-2">
        <input readOnly dir="ltr" className={`${fieldClassName} bg-surface-muted`} aria-label={links.preview} value={preview} />
        <button type="button" aria-label={copied ? links.copied : links.copyLink} disabled={!preview} onClick={() => onCopy(preview)} className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-foreground disabled:opacity-40">
          {copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        </button>
      </div>
      <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${found ? (kind === "external" ? "text-sky-700 dark:text-sky-300" : "text-emerald-700 dark:text-emerald-300") : "text-rose-600 dark:text-rose-300"}`}>
        {found ? <Check className="size-3.5" aria-hidden="true" /> : null}
        {status}
      </p>
    </div>
  );
  const actions = (
    <span className="flex items-center gap-1">
      <IconButton quiet label={copy.moveUp} disabled={index === 0} onClick={() => move(update, (draft) => draft.footer.links, index, -1)}><ArrowUp className="size-3.5" /></IconButton>
      <IconButton quiet label={copy.moveDown} disabled={last} onClick={() => move(update, (draft) => draft.footer.links, index, 1)}><ArrowDown className="size-3.5" /></IconButton>
      <button type="button" aria-label={copy.remove} onClick={() => setConfirming(true)} className="inline-flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"><Trash2 className="size-4" aria-hidden="true" /></button>
    </span>
  );

  return (
    <>
      {layout === "row" ? (
        <tr className="border-t border-line align-top">
          <td className="border-t border-line px-2 py-3 text-muted">{index + 1}</td>
          <td className="border-t border-line px-2 py-3">{show}</td>
          <td className="border-t border-line px-2 py-3">{labelEn}</td>
          <td className="border-t border-line px-2 py-3">{labelAr}</td>
          <td className="border-t border-line px-2 py-3">{type}</td>
          <td className="border-t border-line px-2 py-3">{destination}</td>
          <td className="border-t border-line px-2 py-3">{previewField}</td>
          <td className="border-t border-line px-2 py-3">{actions}</td>
        </tr>
      ) : (
        <div className="grid gap-3 rounded-xl border border-line p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted">#{index + 1}</span>
            <label className="inline-flex items-center gap-2 text-sm">{show}{links.show}</label>
            {actions}
          </div>
          <Field label={links.labelEn}>{labelEn}</Field>
          <Field label={links.labelAr} dir="rtl">{labelAr}</Field>
          <Field label={links.linkType}>{type}</Field>
          <Field label={links.destination}>{destination}</Field>
          <Field label={links.preview}>{previewField}</Field>
        </div>
      )}
      {confirming ? createPortal(<ConfirmPopup copy={copy} onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); update((draft) => { draft.footer.links.splice(index, 1); }); }} />, document.body) : null}
    </>
  );
}

function SeoFields({ copy, language, content, mediaBase, update, onNotice }: { copy: HomepageEditorCopy; language: Locale; content: HomepageContent; mediaBase: string | null; update: (recipe: (draft: HomepageContent) => void) => void; onNotice: (code: HomepageActionCode) => void }) {
  return (
    <div className="grid gap-4">
      <Pair label={copy.fields.seoTitle} value={content.seo.title} language={language} onChange={(value) => update((draft) => { draft.seo.title[language] = value; })} />
      <Area label={copy.fields.seoDescription} value={content.seo.description[language]} onChange={(value) => update((draft) => { draft.seo.description[language] = value; })} />
      <Pair label={copy.fields.ogTitle} value={content.seo.ogTitle} language={language} onChange={(value) => update((draft) => { draft.seo.ogTitle[language] = value; })} />
      <Area label={copy.fields.ogDescription} value={content.seo.ogDescription[language]} onChange={(value) => update((draft) => { draft.seo.ogDescription[language] = value; })} />
      <Pair label={copy.alt} value={content.seo.imageAlt} language={language} onChange={(value) => update((draft) => { draft.seo.imageAlt[language] = value; })} />
      <Toggle label={copy.fields.index} checked={content.seo.index} onChange={(checked) => update((draft) => { draft.seo.index = checked; })} />
      <ImageField copy={copy} label={copy.sections.seo} path={content.seo.imagePath} mediaBase={mediaBase} onNotice={onNotice} onPath={(path) => update((draft) => { draft.seo.imagePath = path; })} />
    </div>
  );
}

function ImageField({ copy, label, path, mediaBase, onPath, onNotice }: { copy: HomepageEditorCopy; label: string; path: string; mediaBase: string | null; onPath: (path: string) => void; onNotice: (code: HomepageActionCode) => void }) {
  const src = mediaBase ? homepageImageUrl(mediaBase, path) : null;
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-sm font-medium">{label}</p>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="mt-3 h-28 w-full rounded-xl object-cover" />
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-line px-3 text-sm font-medium hover:bg-surface-muted">
          {copy.changeImage}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const data = new FormData();
            data.set("file", file);
            const result = await uploadHomepageImageAction(data);
            if (!result.ok) {
              onNotice(result.code);
              return;
            }
            if (path) {
              await removeHomepageImageAction(path);
            }
            onPath(result.path);
          }} />
        </label>
        {path ? <button type="button" className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm" onClick={async () => { const result = await removeHomepageImageAction(path); if (!result.ok) { onNotice(result.code); return; } onPath(""); }}>{copy.removeImage}</button> : null}
      </div>
      <p className="mt-2 text-xs text-muted">{copy.imageHint}</p>
    </div>
  );
}

function ListSection({ copy, enabled, onEnabled, onAdd, children }: { copy: HomepageEditorCopy; enabled: boolean; onEnabled: (checked: boolean) => void; onAdd: () => void; children: ReactNode }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <Toggle label={copy.enabled} checked={enabled} onChange={onEnabled} />
        <button type="button" onClick={onAdd} className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium">{copy.add}</button>
      </div>
      {children}
    </div>
  );
}

function Entry({ copy, enabled, enabledLabel, onEnabled, onRemove, onUp, onDown, upDisabled, downDisabled, hideRemove = false, children }: { copy: HomepageEditorCopy; enabled: boolean; enabledLabel?: string; onEnabled: (checked: boolean) => void; onRemove: () => void; onUp: () => void; onDown: () => void; upDisabled: boolean; downDisabled: boolean; hideRemove?: boolean; children: ReactNode }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="grid gap-3 rounded-xl border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <Toggle label={enabledLabel ?? copy.enabled} checked={enabled} onChange={onEnabled} />
        <span className="flex gap-1">
          <IconButton label={copy.moveUp} disabled={upDisabled} onClick={onUp}><ArrowUp className="size-4" /></IconButton>
          <IconButton label={copy.moveDown} disabled={downDisabled} onClick={onDown}><ArrowDown className="size-4" /></IconButton>
          {hideRemove ? null : <IconButton label={copy.remove} onClick={() => setConfirming(true)}><Trash2 className="size-4" /></IconButton>}
        </span>
      </div>
      {children}
      {confirming ? <ConfirmPopup copy={copy} onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); onRemove(); }} /> : null}
    </div>
  );
}

function ConfirmPopup({ copy, onConfirm, onCancel }: { copy: HomepageEditorCopy; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="homepage-remove-title" className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]" onClick={(event) => event.stopPropagation()}>
        <h2 id="homepage-remove-title" className="text-base font-semibold text-foreground">{copy.confirmRemove}</h2>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="inline-flex h-10 items-center rounded-xl border border-line bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{copy.cancel}</button>
          <button type="button" autoFocus onClick={onConfirm} className="inline-flex h-10 items-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">{copy.remove}</button>
        </div>
      </div>
    </div>
  );
}

function move<T>(update: (recipe: (draft: HomepageContent) => void) => void, select: (draft: HomepageContent) => T[], index: number, direction: -1 | 1) {
  update((draft) => {
    const list = select(draft);
    const next = index + direction;
    if (next < 0 || next >= list.length) return;
    const [item] = list.splice(index, 1);
    if (item) list.splice(next, 0, item);
  });
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <Checkbox label={label} checked={checked} onCheckedChange={onChange} />;
}

function Field({ label, required = false, dir, children }: { label: string; required?: boolean; dir?: "ltr" | "rtl"; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span dir={dir} className={`font-medium text-foreground ${dir === "rtl" ? "text-end" : ""}`}>{label}{required ? <span className="text-rose-500"> *</span> : null}</span>
      {children}
    </label>
  );
}

function Pair({ label, value, language, onChange }: { label: string; value: LocalizedText; language: Locale; onChange: (value: string) => void }) {
  return <Field label={label}><input className={fieldClassName} value={value[language]} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function Area({ label, value, dir, onChange }: { label: string; value: string; dir?: "ltr" | "rtl"; onChange: (value: string) => void }) {
  return <Field label={label} dir={dir}><textarea dir={dir} rows={3} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" value={value} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function IconButton({ label, disabled, quiet = false, onClick, children }: { label: string; disabled?: boolean; quiet?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={quiet ? "inline-flex size-6 items-center justify-center rounded-md text-current/70 hover:bg-surface hover:text-current disabled:opacity-30" : "inline-flex size-8 items-center justify-center rounded-lg border border-line text-muted hover:text-foreground disabled:opacity-40"}>{children}</button>;
}
