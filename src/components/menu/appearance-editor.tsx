"use client";

import { Monitor, Smartphone } from "lucide-react";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ThemePreview } from "@/components/menu/theme-preview";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { MenuView } from "@/components/public-menu/menu-view";
import type { AppearanceCopy } from "@/lib/i18n/appearance-copy";
import type { MenuCopy } from "@/lib/i18n/menu-copy";
import type { PublicMenuCopy } from "@/lib/i18n/public-menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import {
  cardLayouts,
  contrastRatio,
  defaultAppearance,
  featuredStyles,
  fontChoices,
  imageRatios,
  menuThemes,
  navStyles,
  spacingSteps,
  typeScales,
  type MenuAppearance,
} from "@/lib/menus/appearance";
import { previewMenu, restoredAppearance, withSampleDishes } from "@/lib/menus/preview-menu";
import type { PublicMenu } from "@/lib/menus/public-menu";
import { saveAppearanceAction } from "@/modules/menus/appearance-actions";

import { prepareMenuImage } from "./prepare-image";

type AppearanceEditorProps = {
  locale: Locale;
  copy: AppearanceCopy;
  menuCopy: MenuCopy;
  publicCopy: PublicMenuCopy;
  businessId: string;
  backHref: string;
  appearance: MenuAppearance;
  menu: PublicMenu;
  canEdit: boolean;
};

type PreviewMode = "desktop" | "mobile";

export function AppearanceEditor({
  locale,
  copy,
  menuCopy,
  publicCopy,
  businessId,
  backHref,
  appearance,
  menu,
  canEdit,
}: AppearanceEditorProps) {
  const [saved, setSaved] = useState(appearance);
  const [draft, setDraft] = useState(appearance);
  const [baseMenu, setBaseMenu] = useState(menu);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [fileGeneration, setFileGeneration] = useState(0);
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previous: Parameters<typeof saveAppearanceAction>[0], formData: FormData) => {
      for (const field of ["logo", "cover"] as const) {
        const current = formData.get(field);
        if (current instanceof File && current.size > 0) {
          formData.set(field, await prepareMenuImage(current));
        }
      }
      return saveAppearanceAction(previous, formData);
    },
    null,
  );
  const [appliedSave, setAppliedSave] = useState<typeof state>(null);
  const titleId = useId();
  if (state && state.appearance && appliedSave !== state) {
    setAppliedSave(state);
    setSaved(state.appearance);
    setDraft(state.appearance);
    if (state.ok) {
      setBaseMenu((current) => ({ ...current, logoUrl: state.logoUrl, coverUrl: state.coverUrl }));
      setLogoFile(null);
      setCoverFile(null);
      setRemoveLogo(false);
      setRemoveCover(false);
      setLogoPreview((current) => replaceObjectUrl(current, null));
      setCoverPreview((current) => replaceObjectUrl(current, null));
      setFileGeneration((current) => current + 1);
    }
  }
  const dirty =
    !sameAppearance(draft, saved) || logoFile !== null || coverFile !== null || removeLogo || removeCover;
  const usingSamples = baseMenu.categories.length === 0;
  const preview = useMemo(() => {
    const next = previewMenu(baseMenu, draft, {
      logoUrl: removeLogo ? null : logoPreview ?? baseMenu.logoUrl,
      coverUrl: removeCover ? null : coverPreview ?? baseMenu.coverUrl,
    });
    return withSampleDishes(next, copy.sampleCategory, copy.sampleDish);
  }, [baseMenu, coverPreview, copy.sampleCategory, copy.sampleDish, draft, logoPreview, removeCover, removeLogo]);
  const lowContrast = contrastRatio(draft.text, draft.background) < 4.5;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (confirming && !dialog.open) {
      dialog.showModal();
    }

    if (!confirming && dialog.open) {
      dialog.close();
    }
  }, [confirming]);

  function update<K extends keyof MenuAppearance>(key: K, value: MenuAppearance[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function clearPickedFiles() {
    setLogoFile(null);
    setCoverFile(null);
    setLogoPreview((current) => replaceObjectUrl(current, null));
    setCoverPreview((current) => replaceObjectUrl(current, null));
    if (logoInput.current) {
      logoInput.current.value = "";
    }
    if (coverInput.current) {
      coverInput.current.value = "";
    }
  }

  function requestCancel() {
    if (!dirty) {
      router.push(backHref);
      return;
    }

    setConfirming(true);
  }

  function resetDraft() {
    setDraft(saved);
    clearPickedFiles();
    setRemoveLogo(false);
    setRemoveCover(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="theme" value={draft.theme} />
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label={menuCopy.displayStyle}>
          {menuThemes.map((theme) => {
            const selected = saved.theme === theme;
            const previewing = draft.theme === theme;
            return (
              <article
                key={theme}
                className={`flex flex-col gap-3 rounded-2xl border p-3 ${previewing ? "border-brand ring-2 ring-brand/30" : "border-line"}`}
              >
                <ThemePreview theme={theme} />
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">{copy.themes[theme]}</h2>
                  {selected ? <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{copy.selectedTheme}</span> : null}
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="h-9 rounded-full border border-line px-3 text-xs font-semibold"
                    onClick={() => setDraft(defaultAppearance(theme))}
                  >
                    {copy.previewTheme}
                  </button>
                  {canEdit ? (
                    <button
                      type="submit"
                      name="applyTheme"
                      value={theme}
                      disabled={pending}
                      className="h-9 rounded-full bg-brand px-3 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {copy.applyTheme}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
        <fieldset disabled={!canEdit || pending} className="flex flex-col gap-4 disabled:opacity-70">
          <legend className="text-lg font-semibold">{copy.title}</legend>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.description}</p>
          {!canEdit ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.readOnly}</p> : null}
          <ColorField label={copy.primary} name="primary" value={draft.primary} onChange={(value) => update("primary", value)} />
          <ColorField label={copy.secondary} name="secondary" value={draft.secondary} onChange={(value) => update("secondary", value)} />
          <ColorField label={copy.background} name="background" value={draft.background} onChange={(value) => update("background", value)} />
          <ColorField label={copy.text} name="text" value={draft.text} onChange={(value) => update("text", value)} />
          {lowContrast ? <p className="text-sm text-amber-800 dark:text-amber-300">{copy.contrast}</p> : null}
          <Choice label={copy.font} name="font" value={draft.font} options={fontChoices} labels={copy.fonts} onChange={(value) => update("font", value)} />
          <Choice label={copy.typeScale} name="typeScale" value={draft.typeScale} options={typeScales} labels={copy.scales} onChange={(value) => update("typeScale", value)} />
          <Choice label={copy.cardLayout} name="cardLayout" value={draft.cardLayout} options={cardLayouts} labels={copy.cards} onChange={(value) => update("cardLayout", value)} />
          <Choice label={copy.imageRatio} name="imageRatio" value={draft.imageRatio} options={imageRatios} labels={copy.ratios} onChange={(value) => update("imageRatio", value)} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{copy.radius}: {draft.radius}</span>
            <input
              type="range"
              name="radius"
              min={0}
              max={32}
              step={1}
              value={draft.radius}
              onChange={(event) => update("radius", Number(event.target.value))}
            />
          </label>
          <Choice label={copy.spacing} name="spacing" value={draft.spacing} options={spacingSteps} labels={copy.spaces} onChange={(value) => update("spacing", value)} />
          <Choice label={copy.navStyle} name="navStyle" value={draft.navStyle} options={navStyles} labels={copy.navs} onChange={(value) => update("navStyle", value)} />
          <Choice label={copy.featuredStyle} name="featuredStyle" value={draft.featuredStyle} options={featuredStyles} labels={copy.featured} onChange={(value) => update("featuredStyle", value)} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{copy.logo}</span>
            <input
              key={`logo-${fileGeneration}`}
              ref={logoInput}
              type="file"
              name="logo"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setLogoFile(file);
                setLogoPreview((current) => replaceObjectUrl(current, file));
                setRemoveLogo(false);
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              name="removeLogo"
              checked={removeLogo}
              onCheckedChange={(checked) => {
                setRemoveLogo(checked);
                if (checked) {
                  setLogoFile(null);
                  setLogoPreview((current) => replaceObjectUrl(current, null));
                  if (logoInput.current) {
                    logoInput.current.value = "";
                  }
                }
              }}
            />
            {copy.removeLogo}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{copy.cover}</span>
            <input
              key={`cover-${fileGeneration}`}
              ref={coverInput}
              type="file"
              name="cover"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setCoverFile(file);
                setCoverPreview((current) => replaceObjectUrl(current, file));
                setRemoveCover(false);
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              name="removeCover"
              checked={removeCover}
              onCheckedChange={(checked) => {
                setRemoveCover(checked);
                if (checked) {
                  setCoverFile(null);
                  setCoverPreview((current) => replaceObjectUrl(current, null));
                  if (coverInput.current) {
                    coverInput.current.value = "";
                  }
                }
              }}
            />
            {copy.removeCover}
          </label>
        </fieldset>
        <div aria-live="polite" role="status" className="text-sm">
          {state?.ok && !dirty ? <p className="text-emerald-800 dark:text-emerald-300">{copy.saved}</p> : null}
          {state && !state.ok ? <p className="text-red-700 dark:text-red-300">{menuCopy.messages[state.message]}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <>
              <button type="submit" disabled={pending} className="h-10 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900">
                {pending ? copy.saving : copy.save}
              </button>
              <button type="button" onClick={resetDraft} disabled={pending} className="h-10 rounded-full border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700">
                {copy.reset}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setDraft(restoredAppearance(draft.theme));
                  clearPickedFiles();
                  setRemoveLogo(false);
                  setRemoveCover(false);
                }}
                className="h-10 rounded-full border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700"
              >
                {copy.restore}
              </button>
            </>
          ) : null}
          <button type="button" onClick={requestCancel} className="h-10 rounded-full border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700">
            {copy.cancel}
          </button>
        </div>
        </div>
      <section aria-labelledby={titleId} className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">{copy.preview}</h2>
          <div role="radiogroup" aria-label={copy.preview} className="flex gap-2">
            {(["desktop", "mobile"] as const).map((mode) => {
              const selected = previewMode === mode;
              return (
                <label
                  key={mode}
                  className={
                    selected
                      ? "relative inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand/10 ps-5 pe-4 text-sm font-medium text-brand"
                      : "inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm text-muted"
                  }
                >
                  {selected ? <span aria-hidden="true" className="absolute start-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand" /> : null}
                  <input
                    type="radio"
                    name="previewMode"
                    value={mode}
                    checked={selected}
                    onChange={() => setPreviewMode(mode)}
                    className="sr-only"
                  />
                  {mode === "desktop" ? <Monitor className="size-4 shrink-0" aria-hidden="true" /> : <Smartphone className="size-4 shrink-0" aria-hidden="true" />}
                  {mode === "desktop" ? copy.desktop : copy.mobile}
                </label>
              );
            })}
          </div>
        </div>
        {usingSamples ? <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{copy.sampleNote}</p> : null}
        <div className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className={previewMode === "mobile" ? "mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] border border-zinc-300 bg-white dark:border-zinc-700" : "w-full overflow-hidden"}>
            <MenuView menu={preview} locale={locale} copy={publicCopy} />
          </div>
        </div>
      </section>
        </div>
      </form>
      <dialog
        ref={dialogRef}
        aria-labelledby="discard-title"
        onClose={() => setConfirming(false)}
        className="w-full max-w-sm rounded-xl bg-white p-5 text-zinc-900 backdrop:bg-black/50 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <h2 id="discard-title" className="text-lg font-semibold">{copy.discardTitle}</h2>
        <p className="mt-2 text-sm">{copy.discardDescription}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setConfirming(false)} className="h-10 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            {copy.stay}
          </button>
          <Link href={backHref} className="inline-flex h-10 items-center rounded-full border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700">
            {copy.discardConfirm}
          </Link>
        </div>
      </dialog>
    </div>
  );
}

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  const [previous, setPrevious] = useState(value);
  if (value !== previous) {
    setPrevious(value);
    setText(value);
  }
  const invalid = !/^#[0-9A-Fa-f]{6}$/.test(text);

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" name={name} value={value} onChange={(event) => onChange(event.target.value.toLowerCase())} className="h-10 w-14 bg-transparent" />
        <input
          value={text}
          aria-label={label}
          aria-invalid={invalid}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            if (/^#[0-9A-Fa-f]{6}$/.test(next)) {
              onChange(next.toLowerCase());
            }
          }}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 font-mono uppercase dark:border-zinc-700 dark:bg-zinc-950"
        />
      </span>
    </label>
  );
}

function Choice<T extends string>({
  label,
  name,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  name: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <Select
        name={name}
        value={value}
        onValueChange={(next) => onChange(next as T)}
        options={options.map((option) => ({ value: option, label: labels[option] }))}
        className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  );
}

function sameAppearance(left: MenuAppearance, right: MenuAppearance) {
  return (Object.keys(left) as (keyof MenuAppearance)[]).every((key) => left[key] === right[key]);
}

function replaceObjectUrl(current: string | null, file: File | null) {
  if (current) {
    URL.revokeObjectURL(current);
  }

  return file ? URL.createObjectURL(file) : null;
}
