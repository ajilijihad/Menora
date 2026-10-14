"use client";

import { Check, Download, FileText, Printer, Upload } from "lucide-react";
import { useActionState, useEffect, useId, useState, type ChangeEvent } from "react";

import type { QrCopy } from "@/lib/i18n/qr-copy";
import { imageExtension, maxImageBytes } from "@/lib/businesses/media";
import { idlePosterState, type PosterSaveMessage } from "@/lib/menus/poster-save";
import { paintQrSvg, type QrMatrix } from "@/lib/menus/qr-style";
import { posterPageSize, posterSizes, type PosterSizeId } from "@/lib/menus/qr-palette";
import { saveMenuPosterAction } from "@/modules/menus/poster-actions";

import type { QrDesign } from "./qr-studio";

const posterAspect: Record<PosterSizeId, string> = {
  a5: "148 / 210",
  a6: "105 / 148",
  a7: "74 / 105",
  square: "1 / 1",
  letter: "8.5 / 11",
};

const posterPrintWidth: Record<PosterSizeId, string> = {
  a5: "148mm",
  a6: "105mm",
  a7: "74mm",
  square: "210mm",
  letter: "8.5in",
};

type QrPosterProps = {
  name: string;
  logoUrl: string | null;
  modules: QrMatrix;
  url: string;
  copy: QrCopy;
  design: QrDesign;
  locale: string;
  businessId: string;
  posterHref: string;
  posterSize: PosterSizeId;
  posterBackgroundUrl: string | null;
};

export function QrPoster({
  name,
  logoUrl,
  modules,
  url,
  copy,
  design,
  locale,
  businessId,
  posterHref,
  posterSize,
  posterBackgroundUrl,
}: QrPosterProps) {
  const fileId = useId();
  const [state, formAction, pending] = useActionState(saveMenuPosterAction, idlePosterState);
  const [size, setSize] = useState(posterSize);
  const [savedSize, setSavedSize] = useState(posterSize);
  const [savedBackgroundUrl, setSavedBackgroundUrl] = useState(posterBackgroundUrl);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [removeSaved, setRemoveSaved] = useState(false);
  const [clientError, setClientError] = useState<PosterSaveMessage | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [appliedToken, setAppliedToken] = useState(0);

  if (state.ok && state.token !== appliedToken) {
    setAppliedToken(state.token);
    setSavedSize(state.size);
    setSize(state.size);
    setSavedBackgroundUrl(state.backgroundUrl);
    setLocalPreview(null);
    setRemoveSaved(false);
    setClientError(null);
    setFileLabel(null);
  }

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  useEffect(() => {
    if (appliedToken === 0) {
      return;
    }
    const input = document.getElementById(fileId);
    if (input instanceof HTMLInputElement) {
      input.value = "";
    }
  }, [appliedToken, fileId]);

  const shownBackground = localPreview ?? (removeSaved ? null : savedBackgroundUrl);
  const dirty = size !== savedSize || localPreview !== null || removeSaved;
  const ready = !dirty && !pending;
  const qr = paintQrSvg(modules, {
    dark: design.dark,
    light: design.light,
    style: design.style,
    logoHref: design.style === "logo" ? logoUrl : null,
  });
  const errorMessage = clientError ? posterErrorText(copy, clientError) : !state.ok ? posterErrorText(copy, state.message) : null;
  const downloadHref = `${posterHref}?style=${design.style}&dark=${encodeURIComponent(design.dark)}&light=${encodeURIComponent(design.light)}`;

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > maxImageBytes || !imageExtension(file.type)) {
      event.target.value = "";
      setClientError(file.size > maxImageBytes ? "image_too_large" : "image_type");
      return;
    }
    setClientError(null);
    setRemoveSaved(false);
    setFileLabel(file.name);
    setLocalPreview(URL.createObjectURL(file));
  }

  return (
    <>
      <article className="qr-hide rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{copy.posterTitle}</h2>
            <p className="mt-0.5 text-sm text-muted">{copy.posterDescription}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
          <PosterFace name={name} logoUrl={logoUrl} qr={qr} scan={copy.posterScan} backgroundUrl={shownBackground} size={size} />
          <div className="min-w-0 flex-1">
            <ul className="flex flex-col gap-2.5 text-sm">
              {copy.posterItems.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <form action={formAction} className="mt-4 flex flex-col gap-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="businessId" value={businessId} />
              <input type="hidden" name="size" value={size} />
              <input type="hidden" name="removeBackground" value={removeSaved ? "1" : ""} />
              <div className="text-sm">
                <span className="mb-1.5 block text-xs text-muted">{copy.posterBackground}</span>
                <label htmlFor={fileId} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 text-sm font-medium text-brand">
                  <Upload className="size-4" aria-hidden="true" />
                  {copy.posterUpload}
                </label>
                <input id={fileId} name="background" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFile} />
                {fileLabel ? <span className="mt-1 block truncate text-xs text-muted">{fileLabel}</span> : null}
              </div>
              {shownBackground ? (
                <button
                  type="button"
                  className="self-start text-xs font-medium text-muted hover:text-foreground"
                  onClick={() => {
                    setLocalPreview(null);
                    setFileLabel(null);
                    setRemoveSaved(Boolean(savedBackgroundUrl));
                    const input = document.getElementById(fileId);
                    if (input instanceof HTMLInputElement) {
                      input.value = "";
                    }
                  }}
                >
                  {copy.posterRemoveBackground}
                </button>
              ) : null}
              <label className="text-sm">
                <span className="mb-1.5 block text-xs text-muted">{copy.posterSize}</span>
                <select
                  value={size}
                  onChange={(event) => setSize(event.target.value as PosterSizeId)}
                  className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium"
                >
                  {posterSizes.map((id) => (
                    <option key={id} value={id}>
                      {copy.posterSizeLabels[id]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={pending || !dirty}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? copy.posterSaving : copy.posterSave}
              </button>
              {errorMessage ? <p className="text-sm text-red-600 dark:text-red-300">{errorMessage}</p> : null}
              {state.ok && !dirty ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{copy.posterSaved}</p> : null}
              {dirty ? <p className="text-sm text-muted">{copy.posterSaveFirst}</p> : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => printPoster(size)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand/40 px-3 text-sm font-semibold text-brand disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Printer className="size-4" aria-hidden="true" />
                  {copy.posterPrint}
                </button>
                {ready ? (
                  <a href={downloadHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand px-3 text-sm font-semibold text-brand">
                    <Download className="size-4" aria-hidden="true" />
                    {copy.downloadPoster}
                  </a>
                ) : (
                  <button type="button" disabled className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand px-3 text-sm font-semibold text-brand disabled:cursor-not-allowed disabled:opacity-50">
                    <Download className="size-4" aria-hidden="true" />
                    {copy.downloadPoster}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </article>
      <div className="poster-print-sheet hidden" aria-hidden="true">
        <PosterFace name={name} logoUrl={logoUrl} qr={qr} scan={copy.posterScan} backgroundUrl={savedBackgroundUrl} size={savedSize} print url={url} />
      </div>
    </>
  );
}

function PosterFace({
  name,
  logoUrl,
  qr,
  scan,
  backgroundUrl,
  size,
  print = false,
  url,
}: {
  name: string;
  logoUrl: string | null;
  qr: string | null;
  scan: string;
  backgroundUrl: string | null;
  size: PosterSizeId;
  print?: boolean;
  url?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#fff7ed] text-zinc-900 ${print ? "" : "w-full max-w-40 shrink-0 rounded-2xl shadow-inner"}`}
      style={{
        aspectRatio: posterAspect[size],
        width: print ? posterPrintWidth[size] : undefined,
        backgroundImage: cssBackground(backgroundUrl),
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className={`absolute inset-[8%] flex flex-col items-center justify-center rounded-2xl bg-white text-center ${print ? "px-8 py-8" : "px-2 py-2"}`}>
        {logoUrl ? (
          // The logo host is the project storage URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className={print ? "size-20 rounded-2xl object-cover" : "size-8 rounded-lg object-cover"} />
        ) : null}
        <p dir="auto" className={print ? "mt-3 line-clamp-2 text-3xl font-bold" : "mt-1 line-clamp-2 text-[11px] font-bold leading-tight"}>
          {name}
        </p>
        {qr ? <div className={print ? "my-4 w-[70%] [&_svg]:h-auto [&_svg]:w-full" : "my-1 w-[78%] [&_svg]:h-auto [&_svg]:w-full"} dangerouslySetInnerHTML={{ __html: qr }} /> : null}
        <p className={print ? "text-xl font-bold uppercase tracking-wide" : "text-[8px] font-bold uppercase tracking-wide"}>{scan}</p>
        {print && url ? <p dir="ltr" className="mt-2 max-w-full break-all text-sm text-zinc-600">{url}</p> : null}
      </div>
    </div>
  );
}

function printPoster(size: PosterSizeId) {
  const style = document.createElement("style");
  style.textContent = `@media print { @page { size: ${posterPageSize[size]}; margin: 0; } body.printing-poster .qr-print-live { display: none !important; } body.printing-poster .poster-print-sheet { display: flex !important; position: fixed; inset: 0; align-items: center; justify-content: center; background: #ffffff !important; } }`;
  document.head.appendChild(style);
  document.body.classList.add("printing-poster");
  const cleanup = () => {
    document.body.classList.remove("printing-poster");
    style.remove();
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
}

function cssBackground(value: string | null): string | undefined {
  if (!value || /["'()\\]/.test(value) || (!/^https?:\/\//.test(value) && !value.startsWith("blob:"))) {
    return undefined;
  }
  return `url("${value}")`;
}

function posterErrorText(copy: QrCopy, message: PosterSaveMessage): string | null {
  if (message === "idle") {
    return null;
  }
  if (message === "image_too_large") {
    return copy.posterTooLarge;
  }
  if (message === "image_type") {
    return copy.posterType;
  }
  if (message === "rate_limited") {
    return copy.posterRate;
  }
  if (message === "poster_unready") {
    return copy.posterUnready;
  }
  return copy.posterFailed;
}
