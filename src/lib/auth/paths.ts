import { isLocale, type Locale } from "../i18n/locales";

const localePath = /^\/(en|ar)(\/|$)/;

export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 2000) {
    return null;
  }

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }

  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    decoded.includes("://") ||
    decoded.includes("..")
  ) {
    return null;
  }

  const withoutHash = decoded.split("#")[0] ?? "";
  const path = withoutHash.split("?")[0] ?? "";

  if (!localePath.test(path) || path.includes("//")) {
    return null;
  }

  return withoutHash;
}

export function authConfirmRedirect(appUrl: string, nextPath: string): string {
  const next = safeNextPath(nextPath);
  if (!next) {
    throw new Error("Refusing to build an auth redirect without a safe next path.");
  }

  const url = new URL("/auth/confirm", appUrl);
  url.searchParams.set("next", next);
  return url.toString();
}

export function localeOfPath(path: string, fallback: Locale): Locale {
  const match = safeNextPath(path)?.match(/^\/(en|ar)(?:\/|$)/);
  return match && isLocale(match[1]) ? match[1] : fallback;
}
