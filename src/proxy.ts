import { NextResponse, type NextRequest } from "next/server";

import { sessionGate } from "@/lib/auth/access";
import { requestHost, shouldResolveCustomHost } from "@/lib/domains/host";
import { hasPublicSupabaseEnv, getPublicEnv } from "@/lib/env/public";
import { isPublicSlug } from "@/lib/businesses/slug";
import {
  isLocale,
  LOCALE_COOKIE,
  localeCookieOptions,
  localeFromPathname,
  localeRedirectPath,
  preferredLocale,
  publicMenuRewritePath,
  publicMenuSlug,
} from "@/lib/i18n/locales";
import { updateSession } from "@/lib/supabase/proxy";

function nextWithPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-menor-pathname", request.nextUrl.pathname);
  headers.set("x-menor-search", request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/auth/")
    || pathname.startsWith("/api/")
    || pathname === "/robots.txt"
    || pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const lang = request.nextUrl.searchParams.get("lang");
  const menuLang = request.nextUrl.searchParams.get("menu-lang");
  if (publicMenuSlug(pathname) && isLocale(lang)) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, lang, localeCookieOptions());
    return response;
  }

  const customSlug = await customMenuSlug(request);
  const rewritePath = customSlug
    ? `/${preferredLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"))}/menu/${customSlug}`
    : publicMenuRewritePath(
    pathname,
    request.cookies.get(LOCALE_COOKIE)?.value,
    request.headers.get("accept-language"),
    lang,
    menuLang,
  );

  const localized = rewritePath
    ? null
    : localeRedirectPath(
        pathname,
        request.cookies.get(LOCALE_COOKIE)?.value,
        request.headers.get("accept-language"),
      );

  if (localized) {
    const url = request.nextUrl.clone();
    url.pathname = localized;
    return NextResponse.redirect(url);
  }

  if (!hasPublicSupabaseEnv()) {
    if (rewritePath) {
      return rewritePublicMenu(request, rewritePath);
    }

    const gate = sessionGate(pathname, false, request.nextUrl.search);
    if (gate.type === "redirect") {
      const url = request.nextUrl.clone();
      url.pathname = gate.pathname;
      url.search = gate.search;
      return NextResponse.redirect(url);
    }

    const response = nextWithPath(request);
    const locale = localeFromPathname(pathname);
    if (locale) {
      response.cookies.set(LOCALE_COOKIE, locale, localeCookieOptions());
    }
    return response;
  }

  return updateSession(request, rewritePath ?? undefined);
}

async function customMenuSlug(request: NextRequest): Promise<string | null> {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  let appHost = "";
  try {
    appHost = new URL(getPublicEnv().NEXT_PUBLIC_APP_URL).hostname;
  } catch {
    return null;
  }

  const host = requestHost(request.headers.get("host"));
  if (!shouldResolveCustomHost(host, appHost)) {
    return null;
  }

  const env = getPublicEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/active_menu_host`, {
      method: "POST",
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ target_host: host }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const slug = await response.json();
    return typeof slug === "string" && isPublicSlug(slug) ? slug : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function rewritePublicMenu(request: NextRequest, rewritePath: string) {
  const url = request.nextUrl.clone();
  url.pathname = rewritePath;
  url.searchParams.delete("lang");
  url.searchParams.delete("menu-lang");
  const headers = new Headers(request.headers);
  headers.set("x-menor-pathname", request.nextUrl.pathname);
  headers.set("x-menor-search", request.nextUrl.search);
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
