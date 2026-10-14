import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { HomepageEditor } from "@/components/admin/homepage-editor";
import { LoadingState } from "@/components/states/loading-state";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homeChrome } from "@/lib/i18n/home-copy";
import { homepageEditorCopy } from "@/lib/i18n/homepage-editor-copy";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { menuQrSvg } from "@/lib/menus/qr-code";
import { appOrigin } from "@/lib/menus/public-url";
import { loadHomepageForEditor } from "@/modules/homepage/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: homepageEditorCopy(locale).title, robots: { index: false, follow: false } };
}

export default async function AdminHomepagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);

  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col justify-center">
          <LoadingState label={dict.states.loading} />
        </main>
      }
    >
      <EditorContent locale={locale} dashboardLabel={dict.nav.dashboard} brand={dict.brand} />
    </Suspense>
  );
}

async function EditorContent({
  locale,
  dashboardLabel,
  brand,
}: {
  locale: Locale;
  dashboardLabel: string;
  brand: string;
}) {
  const loaded = await loadHomepageForEditor();
  let mediaBase: string | null = null;
  let origin: string | null = null;
  try {
    const env = getPublicEnv();
    mediaBase = env.NEXT_PUBLIC_SUPABASE_URL;
    origin = appOrigin(env.NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development");
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      throw error;
    }
  }
  const qrSvg = origin ? await menuQrSvg(`${origin}/${locale}/register`) : null;

  return (
    <HomepageEditor
      locale={locale}
      copy={homepageEditorCopy(locale)}
      initial={loaded.content}
      plans={loaded.plans}
      storedValid={loaded.valid && !loaded.unavailable}
      storageReady={!loaded.unavailable}
      mediaBase={mediaBase}
      qrSvg={qrSvg}
      brand={brand}
      dashboardLabel={dashboardLabel}
      chrome={{ en: homeChrome("en"), ar: homeChrome("ar") }}
    />
  );
}
