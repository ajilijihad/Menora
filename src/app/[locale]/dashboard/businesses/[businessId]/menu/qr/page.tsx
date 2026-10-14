import type { Metadata } from "next";
import { ArrowLeft, QrCode } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { QrBoard } from "@/components/menu/qr-board";
import { LoadingState } from "@/components/states/loading-state";
import { canEditMenu } from "@/lib/businesses/access";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";
import { menuQrModules, menuQrSvg } from "@/lib/menus/qr-code";
import { loadMenuPoster, loadMenuQr } from "@/lib/menus/qr-access";
import { getMyBusiness } from "@/modules/businesses/queries";

type QrPageProps = {
  params: Promise<{ locale: string; businessId: string }>;
};

export async function generateMetadata({ params }: QrPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).qr.title, robots: { index: false, follow: false } };
}

export default function QrPage({ params }: QrPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col justify-center">
          <LoadingState />
        </main>
      }
    >
      <QrContent params={params} />
    </Suspense>
  );
}

async function QrContent({ params }: { params: QrPageProps["params"] }) {
  const { locale, businessId } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const business = await getMyBusiness(businessId);
  if (!business || !canEditMenu(business.role)) {
    notFound();
  }

  const loaded = await loadMenuQr(business.id);
  if (!loaded) {
    notFound();
  }

  const dict = getDictionary(locale);
  const copy = dict.qr;
  const modules = loaded.url ? menuQrModules(loaded.url) : null;
  const svg = loaded.url ? await menuQrSvg(loaded.url) : null;
  const poster = await loadMenuPoster(business.id);
  const base = `/${locale}/dashboard/businesses/${business.id}`;
  const published = business.isPublished && business.status === "active";

  return (
    <main className="flex flex-col gap-5">
      <style>{`
        .qr-print-sheet { display: none; }
        @media print {
          [data-dashboard] > div > div:first-child,
          [data-dashboard] header,
          .qr-hide { display: none !important; }
          .qr-print-live {
            display: flex !important;
            align-items: center;
            justify-content: center;
            gap: 2.5rem;
            min-height: 100vh;
            background: #ffffff !important;
            color: #111827 !important;
          }
          [data-dashboard] { background: #ffffff !important; }
          .qr-print-sheet {
            display: flex !important;
            align-items: center;
            justify-content: center;
            gap: 2.5rem;
            min-height: 100vh;
            background: #ffffff !important;
            color: #111827 !important;
          }
        }
      `}</style>
      <header className="qr-hide">
        <Link href={`${base}/menu`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {dict.appearance.back}
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <QrCode className="size-6 text-brand" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted">{copy.description}</p>
        <p className="mt-1 text-sm font-medium">{business.name}</p>
      </header>
      {!loaded.url || !svg || !modules ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{copy.unavailable}</p>
      ) : (
        <>
          {published ? null : (
            <p className="qr-hide rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
              {copy.hidden}{" "}
              <Link href={base} className="font-semibold text-brand">{copy.publishLink}</Link>
            </p>
          )}
          <QrBoard
            url={loaded.url}
            modules={modules}
            svg={svg}
            name={business.name}
            logoUrl={loaded.logoUrl}
            published={published}
            copy={copy}
            pngHref={`${base}/menu/qr/png`}
            svgHref={`${base}/menu/qr/svg`}
            locale={locale}
            businessId={business.id}
            posterHref={`${base}/menu/qr/poster`}
            posterSize={poster.size}
            posterBackgroundUrl={poster.backgroundUrl}
          />
        </>
      )}
    </main>
  );
}
