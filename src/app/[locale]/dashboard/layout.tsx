import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache, Suspense, type ReactNode } from "react";

import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { canEditBusiness } from "@/lib/businesses/access";
import { businessMediaUrl } from "@/lib/businesses/media-url";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAuthenticatedUser, getOwnProfile } from "@/modules/auth";
import { listMyBusinesses } from "@/modules/businesses/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <DashboardFrame
      menuLabel={dict.dashboard.menuLabel}
      sidebar={
        <Suspense fallback={<div className="h-dvh bg-surface" />}>
          <DashboardSidebarSlot locale={locale} />
        </Suspense>
      }
      topbar={
        <Suspense fallback={<div className="h-10" />}>
          <DashboardTopbarSlot locale={locale} />
        </Suspense>
      }
    >
      {children}
    </DashboardFrame>
  );
}

const loadDashboardChrome = cache(async function loadDashboardChrome(locale: Locale) {
  await connection();
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard`)}`);
  }

  const dict = getDictionary(locale);
  const businesses = await listMyBusinesses();
  const profile = await getOwnProfile();
  const displayName = profile?.full_name || user.email || dict.brand;
  let isAdmin = profile?.is_platform_admin === true;
  if (!isAdmin) {
    try {
      const supabase = await createServerSupabaseClient();
      const appointed = await supabase.rpc("is_platform_admin");
      isAdmin = appointed.data === true;
    } catch {
      isAdmin = false;
    }
  }

  return {
    dict,
    displayName,
    isAdmin,
    businesses: businesses.map((business) => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      logoUrl: businessMediaUrl(business.logoPath),
      canManage: canEditBusiness(business.role),
      role: business.role,
    })),
  };
});

async function DashboardSidebarSlot({ locale }: { locale: Locale }) {
  const chrome = await loadDashboardChrome(locale);
  return (
    <DashboardSidebar
      locale={locale}
      copy={chrome.dict.dashboard}
      brand="Menor"
      pathname={`/${locale}/dashboard`}
      businesses={chrome.businesses}
    />
  );
}

async function DashboardTopbarSlot({ locale }: { locale: Locale }) {
  const chrome = await loadDashboardChrome(locale);
  const dict = chrome.dict;
  return (
    <DashboardTopbar
      locale={locale}
      copy={dict.dashboard}
      profileLabel={dict.nav.profile}
      adminLabel={dict.nav.admin}
      logoutLabel={dict.nav.logout}
      languageLabel={dict.language.switchTo}
      displayName={chrome.displayName}
      isAdmin={chrome.isAdmin}
      businesses={chrome.businesses}
      selectorLabel={dict.business.selectorLabel}
      pathname={`/${locale}/dashboard`}
    />
  );
}
