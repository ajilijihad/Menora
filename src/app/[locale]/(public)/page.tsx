import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LandingPage } from "@/components/home/landing-page";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { localizedText } from "@/lib/homepage/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { homeChrome } from "@/lib/i18n/home-copy";
import { isLocale } from "@/lib/i18n/locales";
import { menuQrSvg } from "@/lib/menus/qr-code";
import { appOrigin } from "@/lib/menus/public-url";
import { hasAuthSessionCookie } from "@/lib/auth/session-cookie";
import { getAuthenticatedUser } from "@/modules/auth";
import { loadHomepage, loadPublicPlans } from "@/modules/homepage/queries";

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

  const [page, plans, user, sessionCookie] = await Promise.all([
    loadHomepage(),
    loadPublicPlans(),
    getAuthenticatedUser().catch(() => null),
    hasAuthSessionCookie().catch(() => false),
  ]);
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
  const dict = getDictionary(locale);

  return (
    <div data-marketing="">
      <LandingPage
        locale={locale}
        brand={dict.brand}
        dashboardLabel={dict.nav.dashboard}
        logoutLabel={dict.nav.logout}
        content={page.content}
        plans={plans}
        chrome={homeChrome(locale)}
        qrSvg={qrSvg}
        signedIn={Boolean(user) || sessionCookie}
        mediaBase={mediaBase}
      />
    </div>
  );
}
