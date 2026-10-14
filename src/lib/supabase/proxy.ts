import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sessionGate } from "@/lib/auth/access";
import { getPublicEnv } from "@/lib/env/public";
import {
  LOCALE_COOKIE,
  localeCookieOptions,
  localeFromPathname,
} from "@/lib/i18n/locales";

import type { Database } from "./database.types";

type SessionCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function nextWithPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-menor-pathname", request.nextUrl.pathname);
  headers.set("x-menor-search", request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

function applySessionCookies(response: NextResponse, cookies: SessionCookie[]) {
  for (const { name, value, options } of cookies) {
    response.cookies.set(name, value, options);
  }
}

export async function updateSession(request: NextRequest, rewritePathname?: string) {
  let response = nextWithPath(request);
  let sessionCookies: SessionCookie[] = [];
  const env = getPublicEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          sessionCookies = cookiesToSet;
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = nextWithPath(request);

          applySessionCookies(response, cookiesToSet);

          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  let isAuthenticated = false;

  try {
    const { data, error } = await supabase.auth.getUser();
    isAuthenticated = Boolean(data.user) && !error;
  } catch (error) {
    console.error("Unable to refresh the Supabase session.", error);
  }

  const gatePath = rewritePathname ?? request.nextUrl.pathname;
  const gate = sessionGate(gatePath, isAuthenticated, request.nextUrl.search);
  let finalResponse = response;

  if (gate.type === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = gate.pathname;
    url.search = gate.search;
    finalResponse = NextResponse.redirect(url);
    applySessionCookies(finalResponse, sessionCookies);
  } else if (rewritePathname) {
    const url = request.nextUrl.clone();
    url.pathname = rewritePathname;
    url.searchParams.delete("lang");
    url.searchParams.delete("menu-lang");
    const headers = new Headers(request.headers);
    headers.set("x-menor-pathname", request.nextUrl.pathname);
    headers.set("x-menor-search", request.nextUrl.search);
    finalResponse = NextResponse.rewrite(url, { request: { headers } });
    applySessionCookies(finalResponse, sessionCookies);
  }

  const browserLocale = localeFromPathname(request.nextUrl.pathname);
  if (browserLocale) {
    finalResponse.cookies.set(LOCALE_COOKIE, browserLocale, localeCookieOptions());
  }

  return finalResponse;
}
