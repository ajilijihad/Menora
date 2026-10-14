import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic, Noto_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { HeaderFallback, SiteHeader } from "@/components/site-header";
import { ThemeSync } from "@/components/theme/theme-toggle";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizedText } from "@/lib/homepage/schema";
import { isLocale, localeDir } from "@/lib/i18n/locales";
import { loadHomepage } from "@/modules/homepage/queries";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
});

const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  const dict = getDictionary(locale);
  const page = await loadHomepage();
  const brand = localizedText(page.content.site.name, locale).trim() || dict.brand;
  return {
    title: {
      default: brand,
      template: `%s · ${brand}`,
    },
    description: dict.home.description,
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} ${plex.variable} h-full antialiased`}
    >
      <body data-locale={locale} className="flex min-h-full flex-col">
        <ThemeSync />
        <Suspense fallback={<HeaderFallback locale={locale} />}>
          <SiteHeader locale={locale} />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
