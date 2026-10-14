import type { Metadata } from "next";

import { appOrigin, canonicalMenuUrl } from "@/lib/menus/public-url";

export function absoluteMenuUrl(slug: string, appUrl: string, nodeEnv: string): string | null {
  return canonicalMenuUrl(slug, appUrl, nodeEnv);
}

export function publishedMenuMetadata(input: {
  name: string;
  description: string;
  slug: string;
  locale: "en" | "ar";
  imageUrl: string | null;
  appUrl: string;
  nodeEnv: string;
}): Metadata {
  const canonical = absoluteMenuUrl(input.slug, input.appUrl, input.nodeEnv) ?? `/menu/${input.slug}`;
  const image = absoluteHttp(input.imageUrl);
  const languages = {
    en: withLang(canonical, "en"),
    ar: withLang(canonical, "ar"),
  };

  return {
    title: { absolute: input.name },
    description: input.description,
    alternates: { canonical, languages },
    openGraph: {
      title: input.name,
      description: input.description,
      url: canonical,
      type: "website",
      locale: input.locale === "ar" ? "ar_AR" : "en_US",
      images: image ? [{ url: image, alt: input.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: input.name,
      description: input.description,
      images: image ? [image] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export function sitemapOrigin(appUrl: string, nodeEnv: string): string | null {
  return appOrigin(appUrl, nodeEnv);
}

function withLang(canonical: string, locale: "en" | "ar"): string {
  const separator = canonical.includes("?") ? "&" : "?";
  return `${canonical}${separator}lang=${locale}`;
}

function absoluteHttp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
