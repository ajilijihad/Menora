import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { MenuBeacon } from "@/components/public-menu/menu-beacon";
import { MenuView } from "@/components/public-menu/menu-view";
import { StatusPanel } from "@/components/states/status-panel";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, LOCALE_COOKIE, menuLanguageChoice } from "@/lib/i18n/locales";
import { isPublicSlug } from "@/lib/businesses/slug";
import { menuJsonLd } from "@/lib/menus/structured-data";
import { absoluteMenuUrl, publishedMenuMetadata } from "@/lib/seo/public-metadata";
import { getPublishedMenu, resolvePublishedSlug } from "@/modules/menus/public-query";

type MenuPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }

  if (!isPublicSlug(slug)) {
    return {
      title: { absolute: getDictionary(locale).publicMenu.notFoundTitle },
      robots: { index: false, follow: false },
    };
  }

  const result = await getPublishedMenu(slug);
  const copy = getDictionary(locale).publicMenu;
  if (result.status !== "ready") {
    return {
      title: { absolute: result.status === "unconfigured" ? copy.unavailableTitle : copy.notFoundTitle },
      robots: { index: false, follow: false },
    };
  }

  const description = (result.menu.description ?? result.menu.name).slice(0, 180);
  const app = publicApp();
  return publishedMenuMetadata({
    name: result.menu.name,
    description,
    slug: result.menu.slug,
    locale,
    imageUrl: result.menu.coverUrl ?? result.menu.logoUrl,
    appUrl: app.url,
    nodeEnv: app.nodeEnv,
  });
}

export default async function PublicMenuPage({ params }: MenuPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isPublicSlug(slug)) {
    notFound();
  }

  const canonical = await resolvePublishedSlug(slug);
  if (canonical.status === "missing") {
    notFound();
  }
  if (canonical.status === "ready" && canonical.slug !== slug) {
    permanentRedirect(`/menu/${canonical.slug}`);
  }

  const result = await getPublishedMenu(slug);
  const copy = getDictionary(locale).publicMenu;
  if (result.status === "missing") {
    notFound();
  }

  if (result.status === "ready") {
    const cookieStore = await cookies();
    const choice = menuLanguageChoice(
      cookieStore.get(LOCALE_COOKIE)?.value,
      result.menu.defaultLanguage,
      locale,
    );
    if (choice.redirect) {
      redirect(`/menu/${result.menu.slug}?menu-lang=${choice.locale}`);
    }
  }

  if (result.status === "unconfigured") {
    const other = locale === "ar" ? "en" : "ar";
    return (
      <main data-public-menu className="flex flex-1 flex-col justify-center">
        <style>{`body > header { display: none !important; }`}</style>
        <StatusPanel title={copy.unavailableTitle} description={copy.unavailableDescription} />
        <p className="mx-auto px-6 pb-16 text-center">
          <a href={`/menu/${slug}?lang=${other}`} className="text-sm font-medium underline-offset-4 hover:underline">
            {getDictionary(locale).language.switchTo}
          </a>
        </p>
      </main>
    );
  }

  const app = publicApp();
  const jsonLd = menuJsonLd(result.menu, locale, absoluteMenuUrl(result.menu.slug, app.url, app.nodeEnv));

  return (
    <div data-public-menu className="flex flex-1 flex-col">
      <style>{`body > header { display: none !important; }`}</style>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /> : null}
      <MenuBeacon slug={result.menu.slug} />
      <MenuView menu={result.menu} locale={locale} copy={copy} />
    </div>
  );
}

function publicApp(): { url: string; nodeEnv: string } {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  try {
    return { url: getPublicEnv().NEXT_PUBLIC_APP_URL, nodeEnv };
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return { url: "", nodeEnv };
    }
    throw error;
  }
}
