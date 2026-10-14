"use client";

import {
  Check,
  Clock,
  Copy,
  Globe,
  ImageIcon,
  Languages,
  Link2,
  MapPin,
  Phone,
  SlidersHorizontal,
  Store,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";

import { Notice } from "@/components/auth/notice";
import { descriptionLimit, socialNetworks, timeZones, weekDays, type BusinessField, type BusinessFormValues, type BusinessMessageCode, type OpeningHours, type SocialNetwork, type WeekDay } from "@/lib/businesses/schema";
import { idleBusinessState } from "@/lib/businesses/form-state";
import type { BusinessCopy } from "@/lib/i18n/business-copy";
import type { Locale } from "@/lib/i18n/locales";
import { saveBusinessAction } from "@/modules/businesses/actions";

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-foreground outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted";

const sections = ["business-info", "opening-hours", "social-links", "media", "localization", "advanced"] as const;
const createSections = ["business-info", "opening-hours", "social-links", "media", "localization"] as const;

type SettingsEditorProps = {
  locale: Locale;
  copy: BusinessCopy;
  mode?: "create" | "edit";
  businessId?: string;
  initial: BusinessFormValues;
  logoUrl: string | null;
  coverUrl: string | null;
  menuOrigin: string | null;
  canDelete: boolean;
  deleteHref: string;
  notice: BusinessMessageCode | null;
};

export function SettingsEditor({
  locale,
  copy,
  mode = "edit",
  businessId,
  initial,
  logoUrl,
  coverUrl,
  menuOrigin,
  canDelete,
  deleteHref,
  notice,
}: SettingsEditorProps) {
  const creating = mode === "create";
  const visibleSections = creating ? createSections : sections;
  const [state, action, pending] = useActionState(saveBusinessAction, idleBusinessState);
  const values = state.values ?? initial;
  const [hours, setHours] = useState<OpeningHours>(values.hours);
  const [slug, setSlug] = useState(values.slug);
  const [descriptionCount, setDescriptionCount] = useState(values.description.length);
  const [active, setActive] = useState<(typeof sections)[number]>("business-info");
  const [copied, setCopied] = useState(false);
  const fieldError = (field: BusinessField) => {
    const code = state.fieldErrors?.[field];
    return code ? copy.messages[code] : undefined;
  };
  const menuUrl = `${menuOrigin ?? ""}/menu/${slug || "…"}`;
  const formKey = `${state.status}:${state.message ?? ""}:${Object.values(state.fieldErrors ?? {}).join(",")}`;
  const [trackedKey, setTrackedKey] = useState(formKey);
  if (trackedKey !== formKey) {
    setTrackedKey(formKey);
    setHours(values.hours);
    setSlug(values.slug);
    setDescriptionCount(values.description.length);
  }

  useEffect(() => {
    const nodes = visibleSections
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        const id = visible?.target.id;
        if (id && visibleSections.some((section) => section === id)) {
          setActive(id as (typeof sections)[number]);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.4] },
    );
    for (const node of nodes) {
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, [visibleSections]);

  function copyMondayHours() {
    setHours((current) => {
      const source = current.monday;
      const next = { ...current };
      for (const day of weekDays) {
        if (day === "monday") {
          continue;
        }
        next[day] = { ...current[day], opens: source.opens, closes: source.closes };
      }
      return next;
    });
  }

  async function copyMenuUrl() {
    if (!menuOrigin || !slug) {
      return;
    }
    try {
      await navigator.clipboard.writeText(`${menuOrigin}/menu/${slug}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const tabs: Array<{ id: (typeof sections)[number]; label: string; icon: LucideIcon }> = [
    { id: "business-info", label: copy.tabs.info, icon: Store },
    { id: "opening-hours", label: copy.tabs.hours, icon: Clock },
    { id: "social-links", label: copy.tabs.social, icon: Link2 },
    { id: "media", label: copy.tabs.media, icon: ImageIcon },
    { id: "localization", label: copy.tabs.localization, icon: Languages },
    ...(creating ? [] : [{ id: "advanced" as const, label: copy.tabs.advanced, icon: SlidersHorizontal }]),
  ];

  return (
    <form
      key={formKey}
      action={action}
      className="flex flex-col gap-5"
      noValidate
      aria-busy={pending}
    >
      <input type="hidden" name="locale" value={locale} />
      {businessId ? <input type="hidden" name="businessId" value={businessId} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{creating ? copy.createTitle : copy.settingsTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{creating ? copy.createDescription : copy.settingsDescription}</p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
        >
          {pending ? copy.pending : creating ? copy.submitCreate : copy.submitSave}
        </button>
      </div>

      {notice === "saved" || notice === "image_failed" ? (
        <Notice tone={notice === "saved" ? "success" : "error"}>{copy.messages[notice]}</Notice>
      ) : null}
      {state.status === "error" && state.message ? <Notice tone="error">{copy.messages[state.message]}</Notice> : null}

      <div className="sticky top-[4.25rem] z-10 -mx-4 overflow-x-auto border-b border-line bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex min-w-max gap-2" role="tablist" aria-label={creating ? copy.createTitle : copy.settingsTitle}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${selected ? "border-brand bg-brand/10 text-brand" : "border-transparent text-muted hover:bg-surface"}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section id="business-info" icon={<Store className="size-4" aria-hidden="true" />} title={copy.infoTitle} hint={copy.infoHint}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <Field label={copy.fields.name} htmlFor="name" required error={fieldError("name")}>
                  <input id="name" name="name" required defaultValue={values.name} autoComplete="organization" className={fieldClassName} />
                </Field>
                <Field label={copy.fields.type} htmlFor="businessType" error={fieldError("businessType")}>
                  <select id="businessType" name="businessType" defaultValue={values.businessType} className={fieldClassName}>
                    {(["restaurant", "cafe", "bakery", "other"] as const).map((type) => (
                      <option key={type} value={type}>{copy.types[type]}</option>
                    ))}
                  </select>
                </Field>
                <Field label={copy.fields.description} htmlFor="description" error={fieldError("description")}>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    maxLength={descriptionLimit}
                    defaultValue={values.description}
                    onChange={(event) => setDescriptionCount(event.target.value.length)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  />
                  <p className="text-end text-xs text-muted">{descriptionCount}/{descriptionLimit}</p>
                </Field>
              </div>
              <div className="flex flex-col gap-4">
                <Field label={copy.fields.slug} htmlFor="slug" required error={fieldError("slug")}>
                  <input id="slug" name="slug" required value={slug} onChange={(event) => setSlug(event.target.value)} autoComplete="off" className={fieldClassName} />
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <span className="min-w-0 flex-1 truncate">{menuUrl}</span>
                    <button type="button" onClick={copyMenuUrl} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-line text-foreground hover:bg-surface-muted" aria-label={copy.copyUrl}>
                      {copied ? <Check className="size-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted">{copy.slugRule}</p>
                </Field>
                <Field label={copy.fields.phone} htmlFor="phone" error={fieldError("phone")}>
                  <span className="relative block">
                    <Phone className="pointer-events-none absolute start-3 top-3 size-4 text-muted" aria-hidden="true" />
                    <input id="phone" name="phone" type="tel" defaultValue={values.phone} autoComplete="tel" className={`${fieldClassName} ps-9`} />
                  </span>
                </Field>
                <Field label={copy.fields.address} htmlFor="address" error={fieldError("address")}>
                  <span className="relative block">
                    <MapPin className="pointer-events-none absolute start-3 top-3 size-4 text-muted" aria-hidden="true" />
                    <input id="address" name="address" defaultValue={values.address} autoComplete="street-address" className={`${fieldClassName} ps-9`} />
                  </span>
                </Field>
                <Field label={copy.fields.mapUrl} htmlFor="mapUrl" error={fieldError("mapUrl")}>
                  <span className="relative block">
                    <Link2 className="pointer-events-none absolute start-3 top-3 size-4 text-muted" aria-hidden="true" />
                    <input id="mapUrl" name="mapUrl" type="url" defaultValue={values.mapUrl} autoComplete="url" className={`${fieldClassName} ps-9`} />
                  </span>
                </Field>
              </div>
            </div>
          </Section>

          <Section id="opening-hours" icon={<Clock className="size-4" aria-hidden="true" />} title={copy.hoursTitle} hint={copy.hoursHint} action={<button type="button" onClick={copyMondayHours} className="inline-flex h-9 items-center rounded-xl border border-line bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{copy.copyHours}</button>}>
            {fieldError("hours") ? <p className="mb-3 text-sm text-red-600 dark:text-red-300">{fieldError("hours")}</p> : null}
            <div className="flex flex-col gap-2">
              {weekDays.map((day) => (
                <HourRow key={day} day={day} copy={copy} hours={hours[day]} onChange={(next) => setHours((current) => ({ ...current, [day]: next }))} />
              ))}
            </div>
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Section id="social-links" icon={<Link2 className="size-4" aria-hidden="true" />} title={copy.socialTitle} hint={copy.socialHint}>
            {fieldError("social") ? <p className="mb-3 text-sm text-red-600 dark:text-red-300">{fieldError("social")}</p> : null}
            <div className="flex flex-col gap-3">
              {socialNetworks.map((network) => (
                <label key={network} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3">
                  <SocialMark network={network} />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs font-medium text-foreground">{copy.social[network]}</span>
                    <input name={network} type="url" defaultValue={values.social[network]} placeholder="https://" autoComplete="url" className={fieldClassName} />
                  </span>
                </label>
              ))}
            </div>
          </Section>
          <Section id="media" icon={<ImageIcon className="size-4" aria-hidden="true" />} title={copy.mediaTitle} hint={copy.mediaHint}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <MediaField name="logo" removeName="removeLogo" label={copy.fields.logo} action={copy.changeLogo} hint={copy.imageHint} removeLabel={copy.removeImage} previewUrl={logoUrl} />
              <MediaField name="cover" removeName="removeCover" label={copy.fields.cover} action={copy.changeCover} hint={copy.imageHint} removeLabel={copy.removeImage} previewUrl={coverUrl} wide />
            </div>
          </Section>
        </div>
      </div>

      <Section id="localization" icon={<Languages className="size-4" aria-hidden="true" />} title={copy.localizationTitle} hint={copy.localizationHint}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={copy.fields.language} htmlFor="defaultLanguage">
            <select id="defaultLanguage" name="defaultLanguage" defaultValue={values.defaultLanguage} className={fieldClassName}>
              <option value="en">{copy.languages.en}</option>
              <option value="ar">{copy.languages.ar}</option>
            </select>
          </Field>
          <Field label={copy.fields.timeZone} htmlFor="timeZone" error={fieldError("timeZone")}>
            <select id="timeZone" name="timeZone" defaultValue={values.timeZone} className={fieldClassName}>
              {timeZones.some((zone) => zone === values.timeZone) ? null : <option value={values.timeZone}>{values.timeZone}</option>}
              {timeZones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {creating ? null : (
        <Section id="advanced" icon={<SlidersHorizontal className="size-4" aria-hidden="true" />} title={copy.advancedTitle} hint={copy.advancedHint}>
          {canDelete ? (
            <Link href={deleteHref} className="inline-flex h-10 items-center rounded-xl border border-red-300 px-4 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40">
              {copy.deleteLink}
            </Link>
          ) : (
            <p className="text-sm text-muted">{copy.readOnly}</p>
          )}
        </Section>
      )}
    </form>
  );
}

function Section({
  id,
  icon,
  title,
  hint,
  action,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  hint: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">{icon}</span>
          <span>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-0.5 text-sm text-muted">{hint}</p>
          </span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required = false,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor={htmlFor} className="font-medium text-foreground">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}

function HourRow({
  day,
  copy,
  hours,
  onChange,
}: {
  day: WeekDay;
  copy: BusinessCopy;
  hours: OpeningHours[WeekDay];
  onChange: (next: OpeningHours[WeekDay]) => void;
}) {
  return (
    <div className={`grid items-center gap-3 rounded-xl border border-line px-3 py-2 sm:grid-cols-[auto_minmax(6rem,1fr)_5.5rem] lg:grid-cols-[auto_7rem_5.5rem_minmax(0,1fr)_minmax(0,1fr)] ${hours.closed ? "bg-surface-muted/70" : "bg-surface"}`}>
      <input
        type="checkbox"
        checked={!hours.closed}
        onChange={(event) => onChange({ ...hours, closed: !event.target.checked })}
        aria-label={copy.days[day]}
        className="size-4 accent-brand"
      />
      {hours.closed ? <input type="hidden" name={`${day}Closed`} value="on" /> : null}
      <span className="text-sm font-medium text-foreground">{copy.days[day]}</span>
      <span className={`inline-flex h-7 w-fit items-center rounded-full px-2 text-xs font-semibold ${hours.closed ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
        {hours.closed ? copy.closed : copy.open}
      </span>
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="w-12">{copy.opens}</span>
        <input type="time" name={`${day}Opens`} value={hours.opens} disabled={hours.closed} onChange={(event) => onChange({ ...hours, opens: event.target.value })} className={fieldClassName} />
      </label>
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="w-12">{copy.closes}</span>
        <input type="time" name={`${day}Closes`} value={hours.closes} disabled={hours.closed} onChange={(event) => onChange({ ...hours, closes: event.target.value })} className={fieldClassName} />
      </label>
    </div>
  );
}

function SocialMark({ network }: { network: SocialNetwork }) {
  const tone: Record<SocialNetwork, string> = {
    instagram: "bg-pink-500/10 text-pink-600",
    facebook: "bg-blue-500/10 text-blue-600",
    tiktok: "bg-slate-500/10 text-foreground",
    x: "bg-slate-500/10 text-foreground",
    website: "bg-brand/10 text-brand",
  };
  return (
    <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${tone[network]}`}>
      <SocialGlyph network={network} />
    </span>
  );
}

function SocialGlyph({ network }: { network: SocialNetwork }) {
  if (network === "website") {
    return <Globe className="size-4" aria-hidden="true" />;
  }
  const paths: Record<Exclude<SocialNetwork, "website">, string> = {
    instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm6.2-.9a1 1 0 1 0 1 1 1 1 0 0 0-1-1z",
    facebook: "M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z",
    tiktok: "M14 4v10.2a3.2 3.2 0 1 1-2.5-3.1V14a1.7 1.7 0 1 0 1.2 1.6V4h1.3a5.2 5.2 0 0 0 3.5 1.8V7.2A6.8 6.8 0 0 1 14 6.2V4z",
    x: "M6 5h3.2l2.6 3.6L14.8 5H18l-4.4 5.7L18.2 19h-3.2l-2.9-4-3.2 4H5.6l4.7-6.1L6 5z",
  };
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d={paths[network]} />
    </svg>
  );
}

function MediaField({
  name,
  removeName,
  label,
  action,
  hint,
  removeLabel,
  previewUrl,
  wide = false,
}: {
  name: string;
  removeName: string;
  label: string;
  action: string;
  hint: string;
  removeLabel: string;
  previewUrl: string | null;
  wide?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const shown = removed ? null : localPreview ?? previewUrl;

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className={wide ? "h-14 w-24 rounded-xl object-cover" : "size-14 rounded-xl object-cover"} />
        ) : (
          <span className={`inline-flex items-center justify-center rounded-xl bg-surface-muted text-muted ${wide ? "h-14 w-24" : "size-14"}`}>
            <ImageIcon className="size-5" aria-hidden="true" />
          </span>
        )}
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium hover:bg-surface-muted">
          {action}
        </button>
        {previewUrl ? (
          <label className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line ${removed ? "bg-rose-500/10 text-rose-600" : "text-muted hover:text-foreground"}`}>
            <input
              type="checkbox"
              name={removeName}
              checked={removed}
              onChange={(event) => {
                setRemoved(event.target.checked);
                if (event.target.checked) {
                  setLocalPreview(null);
                  if (inputRef.current) {
                    inputRef.current.value = "";
                  }
                }
              }}
              className="sr-only"
            />
            <Trash2 className="size-4" aria-hidden="true" />
            <span className="sr-only">{removeLabel}</span>
          </label>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }
          setRemoved(false);
          setLocalPreview(URL.createObjectURL(file));
        }}
      />
    </div>
  );
}
