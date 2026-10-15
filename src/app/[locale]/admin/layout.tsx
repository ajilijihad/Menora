import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { LoadingState } from "@/components/states/loading-state";
import { StatusPanel, statusActionClassName } from "@/components/states/status-panel";
import { canAccessAdmin } from "@/lib/auth/access";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/modules/auth";

export default async function AdminLayout({
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
      <AdminGuard locale={locale}>{children}</AdminGuard>
    </Suspense>
  );
}

async function AdminGuard({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  await connection();
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/admin`)}`);
  }

  const supabase = await createServerSupabaseClient();
  const appointed = await supabase.rpc("is_platform_admin");
  if (!canAccessAdmin({ userId: user.id, appointed: appointed.data === true })) {
    const dict = getDictionary(locale);
    return (
      <main className="flex flex-1 flex-col justify-center">
        <StatusPanel title={dict.admin.deniedTitle} description={dict.admin.deniedDescription}>
          <Link href={`/${locale}/dashboard`} className={statusActionClassName}>
            {dict.admin.backToDashboard}
          </Link>
        </StatusPanel>
      </main>
    );
  }

  const dict = getDictionary(locale);
  return (
    <>
      <AdminNav locale={locale} copy={dict.admin} />
      {children}
    </>
  );
}
