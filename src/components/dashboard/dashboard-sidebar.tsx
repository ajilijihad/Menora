"use client";

import {
  BarChart3,
  CreditCard,
  Globe,
  LayoutDashboard,
  Palette,
  QrCode,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import type { BusinessRole } from "@/lib/businesses/access";
import { businessIdFromPath } from "@/lib/businesses/ids";
import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/locales";

import { useSyncedPathname } from "./use-synced-pathname";

export type SidebarBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  canManage: boolean;
  role: BusinessRole;
};

type DashboardSidebarProps = {
  locale: Locale;
  copy: DashboardCopy;
  brand: string;
  pathname: string;
  businesses: SidebarBusiness[];
};

type Icon = ComponentType<{ className?: string }>;

export function DashboardSidebar({ locale, copy, brand, pathname: serverPathname, businesses }: DashboardSidebarProps) {
  const pathname = useSyncedPathname(serverPathname);
  const currentId = businessIdFromPath(pathname);
  const business = businesses.find((item) => item.id.toLowerCase() === currentId) ?? null;
  const base = business ? `/${locale}/dashboard/businesses/${business.id}` : `/${locale}/dashboard`;
  const items: { href: string; label: string; icon: Icon; active: boolean; show: boolean }[] = [
    {
      href: base,
      label: copy.nav.dashboard,
      icon: LayoutDashboard,
      active: pathname === `/${locale}/dashboard` || pathname === base,
      show: true,
    },
    {
      href: `${base}/menu`,
      label: copy.nav.menu,
      icon: UtensilsCrossed,
      active: Boolean(business) && pathname.startsWith(`${base}/menu`) && !pathname.includes("/appearance") && !pathname.includes("/qr"),
      show: Boolean(business),
    },
    {
      href: `${base}/menu/appearance`,
      label: copy.nav.design,
      icon: Palette,
      active: Boolean(business) && pathname.includes("/menu/appearance"),
      show: Boolean(business),
    },
    {
      href: `${base}/menu/qr`,
      label: copy.nav.qr,
      icon: QrCode,
      active: Boolean(business) && pathname.includes("/menu/qr"),
      show: Boolean(business),
    },
    {
      href: `${base}/analytics`,
      label: copy.nav.analytics,
      icon: BarChart3,
      active: Boolean(business) && pathname.startsWith(`${base}/analytics`),
      show: Boolean(business),
    },
    {
      href: `${base}/domain`,
      label: copy.nav.domain,
      icon: Globe,
      active: Boolean(business) && pathname.startsWith(`${base}/domain`),
      show: Boolean(business?.canManage),
    },
    {
      href: `/${locale}/dashboard/billing`,
      label: copy.nav.billing,
      icon: CreditCard,
      active: pathname.startsWith(`/${locale}/dashboard/billing`),
      show: !business && businesses.some((item) => item.role === "owner"),
    },
    {
      href: `${base}/settings`,
      label: copy.nav.settings,
      icon: Settings,
      active: Boolean(business) && (pathname.startsWith(`${base}/settings`) || pathname.startsWith(`${base}/delete`)),
      show: Boolean(business?.canManage),
    },
  ];

  return (
    <aside className="flex h-full flex-col border-e border-line bg-sidebar px-3 py-4">
      <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 px-2 py-1">
        <span className="grid size-9 place-items-center rounded-xl bg-brand text-sm font-semibold text-white">M</span>
        <span className="text-lg font-semibold tracking-tight">{brand}</span>
      </Link>
      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {items.filter((item) => item.show).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                item.active ? "bg-brand/10 text-brand" : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {item.active ? <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-brand" /> : null}
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {business ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoUrl} alt="" className="size-10 rounded-xl object-cover" />
            ) : (
              <span className="grid size-10 place-items-center rounded-xl bg-brand/15 text-sm font-semibold text-brand">
                {business.name.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{business.name}</p>
              <p className="truncate text-xs text-muted">menu/{business.slug}</p>
            </div>
          </div>
          <Link
            href={`/menu/${business.slug}`}
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-brand text-sm font-medium text-white transition hover:bg-brand-hover"
          >
            {copy.menuButton}
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
