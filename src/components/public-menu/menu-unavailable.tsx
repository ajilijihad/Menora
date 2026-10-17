import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type MenuUnavailableProps = {
  brand: string;
  title: string;
  description: string;
  homeHref: string;
  actionLabel: string;
};

export function MenuUnavailable({ brand, title, description, homeHref, actionLabel }: MenuUnavailableProps) {
  return (
    <main data-public-menu className="relative flex min-h-dvh flex-1 flex-col items-center justify-center overflow-hidden bg-[#f6f7fb] px-4 py-8 dark:bg-background">
      <style>{`body > header { display: none !important; }`}</style>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -start-20 size-80 rounded-full bg-[#ffe4d6] blur-3xl dark:bg-brand/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 end-0 size-64 rounded-full bg-[#fff1ea] blur-3xl dark:bg-transparent" />

      <div className="relative flex w-full max-w-[26rem] flex-col items-center">
        <Link
          href={homeHref}
          className="mb-6 inline-flex items-center gap-2.5 rounded-xl text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-sm font-bold text-white">M</span>
          <span className="text-lg font-semibold tracking-tight">{brand}</span>
        </Link>

        <section className="w-full rounded-[28px] border border-white/80 bg-surface px-6 py-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:px-10 sm:py-10 dark:border-line">
          <MenuMissingArt />
          <h1 className="mt-2 text-[1.65rem] font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">{description}</p>
          <Link
            href={homeHref}
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {actionLabel}
          </Link>
        </section>
      </div>
    </main>
  );
}

function MenuMissingArt() {
  return (
    <svg viewBox="0 0 280 188" className="mx-auto h-44 w-full max-w-[17rem]" aria-hidden="true">
      <ellipse cx="142" cy="104" rx="108" ry="72" fill="#ffe8dc" />
      <ellipse cx="58" cy="78" rx="22" ry="10" fill="#fff" opacity="0.9" />
      <ellipse cx="214" cy="64" rx="18" ry="8" fill="#fff" opacity="0.85" />
      <path d="M46 128c8-18 22-18 28-4 6 12-4 22-16 22-10 0-16-8-12-18z" fill="#ffd3c2" />
      <path d="M232 132c-10-16-24-12-26 2-2 12 8 20 18 16 8-3 12-10 8-18z" fill="#ffd7c8" />

      <path d="M90 52h100v16c-8 8-16 8-24 0s-16-8-24 0-16 8-24 0-16-8-24 0-16 8-24 0V52z" fill="#ff5a24" />
      <path d="M96 54h14v14c-4 5-10 5-14 0V54zm22 0h14v14c-4 5-10 5-14 0V54zm22 0h14v14c-4 5-10 5-14 0V54zm22 0h14v14c-4 5-10 5-14 0V54z" fill="#ff8a62" />

      <rect x="92" y="78" width="96" height="86" rx="14" fill="#fff" stroke="#edf1f6" />
      <circle cx="140" cy="102" r="15" fill="#fff4ee" stroke="#ffd7c4" />
      <path d="M112 124h28" stroke="#d7dee8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="108" cy="124" r="2.2" fill="#ffb199" />
      <path d="M112 136h36" stroke="#e6ebf2" strokeWidth="4" strokeLinecap="round" />
      <circle cx="108" cy="136" r="2.2" fill="#ffc7b5" />
      <path d="M112 148h22" stroke="#eef2f6" strokeWidth="4" strokeLinecap="round" />

      <g transform="translate(158 108) rotate(8)">
        <rect x="0" y="0" width="72" height="64" rx="12" fill="#fff" stroke="#edf1f6" />
        <path d="M12 12h8v8h-8zM24 12h8v8h-8zM36 12h8v8h-8zM12 24h8v8h-8zM36 24h8v8h-8zM12 36h8v8h-8zM24 36h8v8h-8zM36 36h8v8h-8zM24 24h8v8h-8z" fill="#243044" />
      </g>
      <g transform="translate(214 96)">
        <circle cx="14" cy="14" r="14" fill="#ff5a24" />
        <path d="M14 8v8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="14" cy="19.5" r="1.4" fill="#fff" />
      </g>
    </svg>
  );
}
