import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { LandingPage } from "@/components/home/landing-page";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { localizedText, type HomepageContent, type PublicPlan } from "@/lib/homepage/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homeChrome, type HomeChrome } from "@/lib/i18n/home-copy";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { menuQrSvg } from "@/lib/menus/qr-code";
import { appOrigin } from "@/lib/menus/public-url";
import { getAuthenticatedUser } from "@/modules/auth";
import { loadHomepage, loadPublicPlans } from "@/modules/homepage/queries";

type HomeShell = {
  locale: Locale;
  brand: string;
  dashboardLabel: string;
  logoutLabel: string;
  content: HomepageContent;
  plans: PublicPlan[];
  chrome: HomeChrome;
  qrSvg: string | null;
  mediaBase: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  const page = await loadHomepage();
  const title = localizedText(page.content.seo.title, locale) || getDictionary(locale).brand;
  const description = localizedText(page.content.seo.description, locale);
  let image: string | null = null;
  try {
    image = homepageImageUrl(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, page.content.seo.imagePath);
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      throw error;
    }
  }

  return {
    title: { absolute: title },
    description,
    robots: page.content.seo.index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: localizedText(page.content.seo.ogTitle, locale) || title,
      description: localizedText(page.content.seo.ogDescription, locale) || description,
      images: image ? [{ url: image, alt: localizedText(page.content.seo.imageAlt, locale) }] : undefined,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const shell = await loadHomeShell(locale);

  return (
    <div data-marketing="">
      <Suspense fallback={<LandingPage {...shell} signedIn={false} />}>
        <HomeWithSession shell={shell} />
      </Suspense>
    </div>
  );
}

async function loadHomeShell(locale: Locale): Promise<HomeShell> {
  const [page, plans] = await Promise.all([loadHomepage(), loadPublicPlans()]);
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
  const dict = getDictionary(locale);
  return {
    locale,
    brand: dict.brand,
    dashboardLabel: dict.nav.dashboard,
    logoutLabel: dict.nav.logout,
    content: page.content,
    plans,
    chrome: homeChrome(locale),
    qrSvg: origin ? await menuQrSvg(`${origin}/${locale}/register`) : null,
    mediaBase,
  };
}

async function HomeWithSession({ shell }: { shell: HomeShell }) {
  await connection();
  let signedIn = false;
  try {
    signedIn = Boolean(await getAuthenticatedUser());
  } catch {
    signedIn = false;
  }

  return <LandingPage {...shell} signedIn={signedIn} />;
}
