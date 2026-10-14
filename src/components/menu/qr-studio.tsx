"use client";

import { Check, ChevronDown, Copy, Download, FileImage, Printer, QrCode, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { QrCopy } from "@/lib/i18n/qr-copy";
import { qrContrast, normalizeQrColor, qrBlack, qrWhite } from "@/lib/menus/qr-palette";
import { paintQrSvg, qrStyles, type QrMatrix, type QrStyle } from "@/lib/menus/qr-style";

export type QrDesign = {
  style: QrStyle;
  dark: string;
  light: string;
};

type QrStudioProps = {
  url: string;
  modules: QrMatrix;
  svg: string;
  name: string;
  logoUrl: string | null;
  published: boolean;
  copy: QrCopy;
  pngHref: string;
  svgHref: string;
  onDesignChange?: (design: QrDesign) => void;
};

export function QrStudio({ url, modules, svg, name, logoUrl, published, copy, pngHref, svgHref, onDesignChange }: QrStudioProps) {
  const [style, setStyle] = useState<QrStyle>("classic");
  const [logoOn, setLogoOn] = useState(Boolean(logoUrl));
  const [dark, setDark] = useState(qrBlack);
  const [light, setLight] = useState(qrWhite);
  const [draftDark, setDraftDark] = useState(qrBlack);
  const [draftLight, setDraftLight] = useState(qrWhite);
  const [contrastError, setContrastError] = useState(false);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const activeStyle: QrStyle = style === "logo" && logoOn && logoUrl ? "logo" : style === "logo" ? "classic" : style;
  const painted = paintQrSvg(modules, {
    dark,
    light,
    style: activeStyle,
    logoHref: activeStyle === "logo" ? logoUrl : null,
  }) ?? svg;

  const query = `style=${activeStyle}&dark=${encodeURIComponent(dark)}&light=${encodeURIComponent(light)}`;

  useEffect(() => {
    onDesignChange?.({ style: activeStyle, dark, light });
  }, [activeStyle, dark, light, onDesignChange]);

  function applyColor(nextDark: string, nextLight: string) {
    const foreground = normalizeQrColor(nextDark);
    const background = normalizeQrColor(nextLight);
    if (!foreground || !background || qrContrast(foreground, background) < 4.5) {
      setContrastError(true);
      return;
    }

    setContrastError(false);
    setDark(foreground);
    setLight(background);
    setDraftDark(foreground);
    setDraftLight(background);
  }

  return (
    <>
      <article className="qr-hide rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-orange-50 text-brand">
            <QrCode className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{copy.customizeTitle}</h2>
            <p className="mt-0.5 text-sm text-muted">{copy.customizeDescription}</p>
          </div>
        </div>
        <h3 className="mt-5 text-sm font-semibold">{copy.styleLabel}</h3>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {qrStyles.map((id) => {
            const active = activeStyle === id;
            const thumb = paintQrSvg(modules, {
              dark: qrBlack,
              light: qrWhite,
              style: id,
              logoHref: null,
            });
            return (
              <button
                key={id}
                type="button"
                disabled={id === "logo" && !logoUrl}
                onClick={() => {
                  setStyle(id);
                  if (id === "logo") {
                    setLogoOn(true);
                  }
                }}
                className={`rounded-2xl border-2 bg-white px-2 py-2.5 text-center text-xs font-medium text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${active ? "border-brand text-foreground" : "border-zinc-200"}`}
              >
                <span className="relative mx-auto block aspect-square w-full max-w-16 overflow-hidden">
                  {thumb ? <span className="[&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: thumb }} /> : null}
                  {id === "logo" ? <span className="absolute inset-0 grid place-items-center"><span className="grid size-5 place-items-center rounded-md bg-brand text-[10px] font-bold text-white">M</span></span> : null}
                </span>
                <span className="mt-1.5 block">{copy.styles[id]}</span>
              </button>
            );
          })}
        </div>
        <h3 className="mt-5 text-sm font-semibold">{copy.colorsLabel}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ColorField
            label={copy.foreground}
            value={draftDark}
            onChange={(value) => {
              setDraftDark(value);
              applyColor(value, draftLight);
            }}
          />
          <ColorField
            label={copy.background}
            value={draftLight}
            onChange={(value) => {
              setDraftLight(value);
              applyColor(draftDark, value);
            }}
          />
        </div>
        {contrastError ? <p className="mt-3 text-sm text-red-600 dark:text-red-300">{copy.contrastError}</p> : null}
        {logoUrl && logoOn ? (
          <div className="mt-5">
            <h3 className="text-sm font-semibold">{copy.logoOptional}</h3>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5">
              {/* The logo host is the project storage URL. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="size-12 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{name}</span>
                <span className="block text-xs text-muted">{copy.logoHint}</span>
              </span>
              <button type="button" aria-label={copy.removeLogo} onClick={() => { setLogoOn(false); setStyle("classic"); }} className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
        <p className="mt-3 text-xs text-muted">{copy.themeNote}</p>
      </article>
      <article className="qr-hide rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-lg font-semibold">{copy.previewTitle}</h2>
        <p className="mt-1 text-sm text-muted">{copy.previewHint}</p>
        <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="w-full max-w-64 rounded-2xl bg-white p-4 shadow-inner">
            <div className="[&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: painted }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // The logo host is the project storage URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={copy.logoAlt} width={48} height={48} className="size-12 rounded-xl object-cover" />
              ) : null}
              <h3 dir="auto" className="text-xl font-semibold">{name}</h3>
            </div>
            <p className="mt-3 text-xs font-medium text-muted">{copy.address}</p>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-line bg-surface-muted px-3 py-2">
              <p dir="ltr" className="min-w-0 flex-1 truncate text-sm">{url}</p>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(url).then(
                    () => {
                      setCopied("done");
                      window.setTimeout(() => setCopied("idle"), 1600);
                    },
                    () => setCopied("failed"),
                  );
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium"
              >
                {copied === "done" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                {copied === "done" ? copy.copied : copied === "failed" ? copy.copyFailed : copy.copyLink}
              </button>
            </div>
            {published ? (
              <p className="mt-3 rounded-2xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                <span className="font-semibold">{copy.publicReady}</span> {copy.publicReadyHint}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <a href={`${pngHref}?${query}`} className="inline-flex h-12 flex-col items-center justify-center rounded-2xl bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-hover">
            <span className="inline-flex items-center gap-1.5"><Download className="size-4" />{copy.downloadPng}</span>
            <span className="text-[11px] font-medium text-white/80">{copy.downloadPngHint}</span>
          </a>
          <a href={`${svgHref}?${query}`} className="inline-flex h-12 flex-col items-center justify-center rounded-2xl border border-brand/40 px-3 text-sm font-semibold text-brand">
            <span className="inline-flex items-center gap-1.5"><FileImage className="size-4" />{copy.downloadSvg}</span>
            <span className="text-[11px] font-medium text-muted">{copy.downloadSvgHint}</span>
          </a>
          <button type="button" onClick={() => window.print()} className="inline-flex h-12 flex-col items-center justify-center rounded-2xl border border-brand/40 px-3 text-sm font-semibold text-brand print:hidden">
            <span className="inline-flex items-center gap-1.5"><Printer className="size-4" />{copy.print}</span>
            <span className="text-[11px] font-medium text-muted">{copy.printHint}</span>
          </button>
        </div>
      </article>
      <section className="qr-print-live hidden" aria-hidden="true">
        <div className="flex max-w-sm flex-col gap-3">
          <h2 className="text-3xl font-semibold">{name}</h2>
          <p className="text-lg">{copy.posterScan}</p>
          <p dir="ltr" className="break-all font-mono text-sm">{url}</p>
        </div>
        <div className="w-64 bg-white [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: painted }} />
      </section>
    </>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      <span className="flex h-12 items-center gap-3 rounded-xl border border-line px-3">
        <span className="relative size-7 shrink-0 overflow-hidden rounded-full border border-line">
          <input
            type="color"
            value={value}
            aria-label={label}
            onChange={(event) => onChange(event.target.value)}
            className="absolute -inset-1 size-9 cursor-pointer border-0 bg-transparent p-0"
          />
        </span>
        <span dir="ltr" className="min-w-0 flex-1 font-medium tracking-wide">{value.toUpperCase()}</span>
        <ChevronDown className="size-4 text-muted" aria-hidden="true" />
      </span>
    </label>
  );
}
