import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { LoadingState } from "@/components/states/loading-state";
import { safeNextPath } from "@/lib/auth/paths";
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
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col justify-center">
          <LoadingState label={dict.states.loading} />
        </main>
      }
    >
      <DashboardGuard locale={locale}>{children}</DashboardGuard>
    </Suspense>
  );
}

async function DashboardGuard({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  await connection();
  const headerStore = await headers();
  const pathname = headerStore.get("x-menor-pathname") ?? `/${locale}/dashboard`;
  const user = await getAuthenticatedUser();
  if (!user) {
    const next = safeNextPath(pathname) ?? `/${locale}/dashboard`;
    redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  }

  const dict = getDictionary(locale);
  const businesses = await listMyBusinesses();
  const profile = await getOwnProfile();
  const displayName = profile?.full_name || user.email || dict.brand;
  let isAdmin = false;
  try {
    const supabase = await createServerSupabaseClient();
    const appointed = await supabase.rpc("is_platform_admin");
    isAdmin = appointed.data === true;
  } catch {
    isAdmin = false;
  }

  const sidebarBusinesses = businesses.map((business) => ({
    id: business.id,
    name: business.name,
    slug: business.slug,
    logoUrl: businessMediaUrl(business.logoPath),
    canManage: canEditBusiness(business.role),
    role: business.role,
  }));

  return (
    <DashboardFrame
      menuLabel={dict.dashboard.menuLabel}
      sidebar={
        <DashboardSidebar
          locale={locale}
          copy={dict.dashboard}
          brand="Menor"
          pathname={pathname}
          businesses={sidebarBusinesses}
        />
      }
      topbar={
        <DashboardTopbar
          locale={locale}
          copy={dict.dashboard}
          profileLabel={dict.nav.profile}
          adminLabel={dict.nav.admin}
          logoutLabel={dict.nav.logout}
          languageLabel={dict.language.switchTo}
          displayName={displayName}
          isAdmin={isAdmin}
          businesses={sidebarBusinesses}
          selectorLabel={dict.business.selectorLabel}
          pathname={pathname}
        />
      }
    >
      {children}
    </DashboardFrame>
  );
}
