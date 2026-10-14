import Link from "next/link";
import { ImagePlus, QrCode } from "lucide-react";

import { CopyLink } from "@/components/dashboard/copy-link";
import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";

type RestaurantHeroProps = {
  copy: DashboardCopy;
  name: string;
  description: string;
  menuPathLabel: string;
  publicUrl: string;
  coverUrl: string;
  published: boolean;
  previewHref: string;
  qrHref: string;
  coverHref: string | null;
};

export function RestaurantHero({
  copy,
  name,
  description,
  menuPathLabel,
  publicUrl,
  coverUrl,
  published,
  previewHref,
  qrHref,
  coverHref,
}: RestaurantHeroProps) {
  return (
    <article className="grid overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-[var(--shadow-card)] lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col justify-between gap-6 p-5 sm:p-6">
        <div>
          <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
            {published ? copy.active : copy.draft}
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-200">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyLink value={publicUrl} label={menuPathLabel} copiedLabel={copy.copied} />
          <Link href={qrHref} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-medium">
            <QrCode className="size-4" />
            {copy.nav.qr}
          </Link>
          <Link href={previewHref} className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover">
            {copy.previewMenu}
          </Link>
        </div>
      </div>
      <div className="relative min-h-56">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
        {coverHref ? (
          <Link
            href={coverHref}
            className="absolute bottom-4 start-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-medium text-white backdrop-blur"
          >
            <ImagePlus className="size-3.5" />
            {copy.changeCover}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
