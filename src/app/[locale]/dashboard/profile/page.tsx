import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthScreen } from "@/components/auth/auth-screen";
import { ProfileForm } from "@/components/auth/profile-form";
import { LoadingState } from "@/components/states/loading-state";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAuthenticatedUser, getOwnProfile } from "@/modules/auth";

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).nav.profile, robots: { index: false, follow: false } };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
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
      <ProfileContent locale={locale} />
    </Suspense>
  );
}

async function ProfileContent({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard/profile`)}`);
  }

  const profile = await getOwnProfile();

  if (!profile) {
    return (
      <AuthScreen title={dict.nav.profile} description={dict.messages.profile_missing} />
    );
  }

  return (
    <AuthScreen title={dict.nav.profile} description={dict.auth.profileDescription}>
      <ProfileForm
        locale={locale}
        copy={dict}
        name={profile.full_name}
        email={profile.email ?? user.email ?? ""}
      />
    </AuthScreen>
  );
}
