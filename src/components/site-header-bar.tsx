"use client";

import { ChevronDown, Globe, Home, LogOut, Menu, Shield, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { isPublicMenuPath, localeFromPathname, type Locale } from "@/lib/i18n/locales";
import { signOutAction } from "@/modules/auth/actions";

export type HeaderLink = {
  id: "login" | "register" | "dashboard" | "admin";
  href: string;
  label: string;
};

export type HeaderAccount = {
  name: string;
  avatarUrl: string | null;
  href: string;
  label: string;
};

type SiteHeaderBarProps = {
  locale: Locale;
  siteName: string;
  logoUrl: string | null;
  languageLabel: string;
  links: HeaderLink[];
  logoutLabel: string | null;
};

const itemClassName =
  "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function SiteHeaderBar({
  locale,
  siteName,
  logoUrl,
  languageLabel,
  links,
  logoutLabel,
}: SiteHeaderBarProps) {
  const pathname = usePathname() || `/${locale}`;
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  if (isPublicMenuPath(pathname) || /\/login(?:\/|$)/.test(pathname)) {
    return <header className="hidden" />;
  }

  const targetLocale = locale === "en" ? "ar" : "en";
  const switchedPath = localeFromPathname(pathname)
    ? pathname.replace(/^\/(en|ar)/, `/${targetLocale}`)
    : `/${targetLocale}`;

  return (
    <header className="px-3 py-3 sm:px-6">
      <div className="mx-auto w-full max-w-7xl rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] dark:shadow-none">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          <Link href={`/${locale}`} className="shrink-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            <BrandLockup name={siteName} logoUrl={logoUrl} />
          </Link>
          <nav aria-label={siteName} className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
            {links.map((link) => (
              <NavLink key={link.id} link={link} pathname={pathname} />
            ))} 
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <Link
              href={switchedPath}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Globe className="size-4 text-muted" aria-hidden="true" />
              <span>{languageLabel}</span>
            </Link>
            {logoutLabel ? <LogoutButton locale={locale} label={logoutLabel} /> : null}
          </div>
        </div>
        {open ? (
          <nav aria-label={siteName} className="flex flex-col gap-1 border-t border-line px-3 py-3 xl:hidden">
            {links.map((link) => (
              <NavLink key={link.id} link={link} pathname={pathname} />
            ))}
            {logoutLabel ? <LogoutButton locale={locale} label={logoutLabel} /> : null}
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function NavLink({ link, pathname }: { link: HeaderLink; pathname: string }) {
  const active = isActive(pathname, link);
  const Icon = link.id === "dashboard" ? User : link.id === "admin" ? Shield : null;

  return (
    <Link href={link.href} aria-current={active ? "page" : undefined} className={`${itemClassName} ${active ? "bg-brand/10 text-brand" : "text-foreground hover:bg-surface-muted"}`}>
      {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
      {link.label}
    </Link>
  );
}

function LogoutButton({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className={`${itemClassName} text-foreground hover:bg-surface-muted`}>
        <LogOut className="size-4 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}

function AccountChip({ account }: { account: HeaderAccount }) {
  const initial = Array.from(account.name.trim())[0]?.toLocaleUpperCase() || "M";

  return (
    <Link
      href={account.href}
      aria-label={`${account.label}, ${account.name}`}
      className="inline-flex h-10 max-w-44 items-center gap-2 rounded-full border border-line bg-surface py-1 ps-1 pe-2.5 text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:max-w-56 sm:pe-3"
    >
      {account.avatarUrl ? (
        // Profile photos are public objects already sized for this mark.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={account.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{initial}</span>
      )}
      <span className="hidden truncate text-sm font-medium sm:inline">{account.name}</span>
      <ChevronDown className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}

function isActive(pathname: string, link: HeaderLink): boolean {
  if (link.id === "dashboard") {
    return pathname === link.href || (pathname.startsWith(`${link.href}/`) && !pathname.startsWith(`${link.href}/profile`));
  }
  return pathname === link.href;
}
