export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const LOCALE_COOKIE = "menor-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ar";
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function localeFromPathname(pathname: string | null | undefined): Locale | null {
  const match = pathname?.match(/^\/(en|ar)(?:\/|$)/);
  return match && isLocale(match[1]) ? match[1] : null;
}

export function preferredLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (isLocale(cookieValue)) {
    return cookieValue;
  }

  return acceptLanguage?.toLowerCase().includes("ar") ? "ar" : "en";
}

/**
 * Returns a locale-prefixed path when the request is outside `/en` and `/ar`.
 * Auth callbacks stay unprefixed so Supabase can redirect to a stable URL.
 */
const publicMenuPattern = /^\/menu\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export function publicMenuSlug(pathname: string): string | null {
  return publicMenuPattern.exec(pathname)?.[1] ?? null;
}

export function isPublicMenuPath(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }

  return pathname === "/menu" || pathname.startsWith("/menu/") || /^\/(en|ar)\/menu(?:\/|$)/.test(pathname);
}

/**
 * Internal path for `/menu/business-slug`. The browser address stays unprefixed.
 * `lang` selects the locale when it is `en` or `ar`; otherwise the locale cookie wins.
 */
export function publicMenuRewritePath(
  pathname: string,
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
  lang: string | null | undefined,
  menuLang?: string | null,
): string | null {
  const slug = publicMenuSlug(pathname);
  if (!slug) {
    return null;
  }

  const explicit = isLocale(lang) ? lang : isLocale(menuLang) ? menuLang : null;
  const locale = explicit ?? preferredLocale(cookieValue, acceptLanguage);
  return `/${locale}/menu/${slug}`;
}

/**
 * A saved locale cookie wins. Otherwise the business default is used, and the
 * page redirects once without storing that default as the visitor's choice.
 */
export function menuLanguageChoice(
  cookieValue: string | null | undefined,
  businessDefault: string | null | undefined,
  pathLocale: Locale,
): { locale: Locale; redirect: boolean } {
  if (isLocale(cookieValue)) {
    return { locale: cookieValue, redirect: false };
  }

  const fallback = isLocale(businessDefault) ? businessDefault : "en";
  return { locale: fallback, redirect: fallback !== pathLocale };
}

export function localeRedirectPath(
  pathname: string,
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): string | null {
  if (
    pathname.startsWith("/auth/")
    || pathname.startsWith("/api/")
    || pathname === "/robots.txt"
    || pathname === "/sitemap.xml"
  ) {
    return null;
  }

  if (localeFromPathname(pathname)) {
    return null;
  }

  const locale = preferredLocale(cookieValue, acceptLanguage);
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

export function localeCookieOptions() {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  };
}
