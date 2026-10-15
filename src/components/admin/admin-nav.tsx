"use client";

import {
  BarChart3,
  CreditCard,
  Globe,
  LayoutGrid,
  Home,
  Eye,
  Mail,
  Receipt,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminCopy } from "@/lib/i18n/admin-copy";
import type { Locale } from "@/lib/i18n/locales";

const items: Array<{ segment: string; label: keyof AdminCopy; icon: LucideIcon }> = [
  { segment: "", label: "navOverview", icon: LayoutGrid },
  { segment: "homepage", label: "navHome", icon: Home },
  { segment: "businesses", label: "navBusinesses", icon: Store },
  { segment: "users", label: "navUsers", icon: Users },
  { segment: "plans", label: "navPlans", icon: CreditCard },
  { segment: "subscriptions", label: "navSubscriptions", icon: Receipt },
  { segment: "payments", label: "navPayments", icon: Wallet },
  { segment: "emails", label: "navEmails", icon: Mail },
  { segment: "domains", label: "navDomains", icon: Globe },
  { segment: "analytics", label: "navAnalytics", icon: BarChart3 },
  { segment: "email", label: "navPreview", icon: Eye },
];

export function AdminNav({ locale, copy }: { locale: Locale; copy: AdminCopy }) {
  const pathname = usePathname();

  return (
    <nav aria-label={copy.title} className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[90rem] gap-1 overflow-x-auto px-4 py-2.5 lg:px-6">
        {items.map((item) => {
          const href = item.segment ? `/${locale}/admin/${item.segment}` : `/${locale}/admin`;
          const current = item.segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href || pathname === `${href}/`;
          const Icon = item.icon;
          const label = copy[item.label];
          return (
            <Link
              key={item.segment || "overview"}
              href={href}
              aria-current={current ? "page" : undefined}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                current ? "bg-brand/10 font-medium text-brand" : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {typeof label === "string" ? label : item.segment}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
