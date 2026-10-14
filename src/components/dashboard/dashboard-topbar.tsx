"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { businessIdFromPath } from "@/lib/businesses/ids";
import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/locales";

import { AccountMenu } from "./account-menu";
import { BusinessSwitcher } from "./business-switcher";
import type { SidebarBusiness } from "./dashboard-sidebar";
import { useSyncedPathname } from "./use-synced-pathname";

type DashboardTopbarProps = {
  locale: Locale;
  copy: DashboardCopy;
  profileLabel: string;
  adminLabel: string;
  logoutLabel: string;
  languageLabel: string;
  displayName: string;
  isAdmin: boolean;
  businesses: SidebarBusiness[];
  selectorLabel: string;
  pathname: string;
};

export function DashboardTopbar({
  locale,
  copy,
  profileLabel,
  adminLabel,
  logoutLabel,
  languageLabel,
  displayName,
  isAdmin,
  businesses,
  selectorLabel,
  pathname: serverPathname,
}: DashboardTopbarProps) {
  const pathname = useSyncedPathname(serverPathname);
  const search = useSearchParams();
  const currentId = businessIdFromPath(pathname);
  const current = businesses.find((business) => business.id.toLowerCase() === currentId) ?? null;
  const targetLocale = locale === "en" ? "ar" : "en";
  const query = search.toString();
  const languageHref = `${pathname.replace(/^\/(en|ar)/, `/${targetLocale}`)}${query ? `?${query}` : ""}`;
  const accountName = current?.name ?? displayName;
  const accountRole = current
    ? current.role === "owner"
      ? copy.accountOwner
      : current.role === "manager"
        ? copy.roleManager
        : copy.roleEditor
    : profileLabel;
  const searchAction = current ? `/${locale}/dashboard/businesses/${current.id}/menu` : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ThemeToggle label={copy.theme} />
      {searchAction ? (
        <form action={searchAction} className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <label className="sr-only" htmlFor="dashboard-search">
            {copy.search}
          </label>
          <input
            id="dashboard-search"
            name="q"
            placeholder={copy.search}
            className="h-10 w-full rounded-full border border-line bg-surface ps-10 pe-4 text-sm text-foreground outline-none placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
        </form>
      ) : (
        <p className="min-w-0 flex-1 truncate text-sm text-muted">{copy.searchNeedsBusiness}</p>
      )}
      <button
        type="button"
        disabled
        aria-label={copy.noNotifications}
        title={copy.noNotifications}
        className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-muted"
      >
        <Bell className="size-4" />
      </button>
      <Link href={languageHref} className="hidden rounded-full border border-line bg-surface px-3 py-2 text-xs font-medium text-muted sm:inline-flex">
        {languageLabel}
      </Link>
      {businesses.length > 1 ? (
        <BusinessSwitcher locale={locale} label={selectorLabel} currentId={currentId} businesses={businesses} />
      ) : null}
      <AccountMenu
        label={copy.accountMenu}
        name={accountName}
        role={accountRole}
        initial={accountName.slice(0, 1).toUpperCase()}
        logoUrl={current?.logoUrl ?? null}
        profileHref={`/${locale}/dashboard/profile`}
        profileLabel={profileLabel}
        adminHref={isAdmin ? `/${locale}/admin` : null}
        adminLabel={adminLabel}
        logoutLabel={logoutLabel}
        locale={locale}
      />
    </div>
  );
}
