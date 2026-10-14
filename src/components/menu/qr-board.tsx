"use client";

import { Lightbulb, MessageCircle, Scan, Smartphone } from "lucide-react";
import { useState } from "react";

import type { QrCopy } from "@/lib/i18n/qr-copy";
import { qrBlack, qrWhite, type PosterSizeId } from "@/lib/menus/qr-palette";
import type { QrMatrix } from "@/lib/menus/qr-style";

import { QrPoster } from "./qr-poster";
import { QrStudio, type QrDesign } from "./qr-studio";

const tipIcons = [Smartphone, Scan, Smartphone, MessageCircle];

type QrBoardProps = {
  url: string;
  modules: QrMatrix;
  svg: string;
  name: string;
  logoUrl: string | null;
  published: boolean;
  copy: QrCopy;
  pngHref: string;
  svgHref: string;
  locale: string;
  businessId: string;
  posterHref: string;
  posterSize: PosterSizeId;
  posterBackgroundUrl: string | null;
};

export function QrBoard(props: QrBoardProps) {
  const [design, setDesign] = useState<QrDesign>({ style: "classic", dark: qrBlack, light: qrWhite });

  return (
    <>
      <section className="grid items-start gap-4 xl:grid-cols-2">
        <QrStudio
          url={props.url}
          modules={props.modules}
          svg={props.svg}
          name={props.name}
          logoUrl={props.logoUrl}
          published={props.published}
          copy={props.copy}
          pngHref={props.pngHref}
          svgHref={props.svgHref}
          onDesignChange={setDesign}
        />
      </section>
      <section className="grid items-start gap-4 lg:grid-cols-2">
        <QrPoster
          name={props.name}
          logoUrl={props.logoUrl}
          modules={props.modules}
          url={props.url}
          copy={props.copy}
          design={design}
          locale={props.locale}
          businessId={props.businessId}
          posterHref={props.posterHref}
          posterSize={props.posterSize}
          posterBackgroundUrl={props.posterBackgroundUrl}
        />
        <article className="qr-hide rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-amber-100 text-amber-500">
              <Lightbulb className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold">{props.copy.tipsTitle}</h2>
          </div>
          <ul className="mt-4 flex flex-col">
            {props.copy.tips.map((tip, index) => {
              const Icon = tipIcons[index] ?? Lightbulb;
              return (
                <li key={tip.title} className="flex items-start gap-3 border-t border-line py-3 first:border-t-0">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{tip.title}</span>
                    <span className="block text-sm text-muted">{tip.body}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </article>
      </section>
    </>
  );
}
