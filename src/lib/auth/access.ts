import { localeFromPathname, type Locale } from "../i18n/locales";
import { safeNextPath } from "./paths";

export type SessionGate =
  | { type: "allow" }
  | { type: "redirect"; pathname: string; search: string };

const guestOnly = new Set(["/login", "/register", "/forgot-password", "/verify-email"]);

function pathAfterLocale(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`;
  const rest = pathname.slice(prefix.length);
  return rest.length === 0 ? "/" : rest;
}

export function sessionGate(pathname: string, isAuthenticated: boolean, search = ""): SessionGate {
  const locale = localeFromPathname(pathname);
  if (!locale) {
    return { type: "allow" };
  }

  const rest = pathAfterLocale(pathname, locale);
  const isProtected =
    rest === "/dashboard" ||
    rest.startsWith("/dashboard/") ||
    rest === "/admin" ||
    rest.startsWith("/admin/");

  if (isProtected && !isAuthenticated) {
    const next = safeNextPath(`${pathname}${search}`) ?? pathname;
    return {
      type: "redirect",
      pathname: `/${locale}/login`,
      search: `?next=${encodeURIComponent(next)}`,
    };
  }

  if (guestOnly.has(rest) && isAuthenticated) {
    return {
      type: "redirect",
      pathname: `/${locale}/dashboard`,
      search: "",
    };
  }

  return { type: "allow" };
}

export function canAccessAdmin(input: { userId: string; appointed: boolean } | null): boolean {
  return Boolean(input?.userId) && input?.appointed === true;
}

export function canResetPassword(hasVerifiedSession: boolean): boolean {
  return hasVerifiedSession;
}
