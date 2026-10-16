import Link from "next/link";

import { SiteHeaderBar } from "@/components/site-header-bar";
import { profileAvatarUrl } from "@/lib/auth/avatar-url";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { localizedText } from "@/lib/homepage/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { getAuthenticatedUser, getOwnProfile } from "@/modules/auth";
import { loadHomepage } from "@/modules/homepage/queries";

type SiteHeaderProps = {
  locale: Locale;
};

export function HeaderFallback({ locale }: SiteHeaderProps) {
  const dict = getDictionary(locale);

  return (
    <header className="px-3 py-3 sm:px-6">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center rounded-2xl border border-line bg-surface px-4">
        <Link href={`/${locale}`} className="text-sm font-semibold tracking-tight">
          {dict.brand}
        </Link>
      </div>
    </header>
  );
}

export async function SiteHeader({ locale }: SiteHeaderProps) {
  const dict = getDictionary(locale);
  let siteName = dict.brand;
  let logoUrl: string | null = null;

  try {
    const page = await loadHomepage();
    siteName = localizedText(page.content.site.name, locale).trim() || dict.brand;
    logoUrl = homepageImageUrl(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, page.content.site.logoPath);
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      siteName = dict.brand;
      logoUrl = null;
    }
  }

  const session = await loadHeaderSession(locale);

  return (
    <SiteHeaderBar
      locale={locale}
      siteName={siteName}
      logoUrl={logoUrl}
      languageLabel={dict.language.switchTo}
      links={session.links}
      logoutLabel={session.logoutLabel}
    />
  );
}

async function loadHeaderSession(locale: Locale) {
  const dict = getDictionary(locale);
  let signedIn = false;
  let isAdmin = false;
  let name = "";
  let avatarUrl: string | null = null;

  try {
    const user = await getAuthenticatedUser();
    signedIn = Boolean(user);
    if (user) {
      const profile = await getOwnProfile();
      isAdmin = profile?.is_platform_admin === true;
      name = profile?.full_name?.trim() || profile?.email || user.email || dict.brand;
      avatarUrl = profileAvatarUrl(profile?.avatar_path ?? null);
    }
  } catch {
    signedIn = false;
  }

  if (!signedIn) {
    return {
      links: [
        { id: "login" as const, href: `/${locale}/login`, label: dict.nav.login },
        { id: "register" as const, href: `/${locale}/register`, label: dict.nav.register },
      ],
      logoutLabel: null,
      account: null,
    };
  }

  return {
    links: [
      { id: "dashboard" as const, href: `/${locale}/dashboard`, label: dict.nav.dashboard },
      ...(isAdmin ? [{ id: "admin" as const, href: `/${locale}/admin`, label: dict.nav.admin }] : []),
    ],
    logoutLabel: dict.nav.logout,
    account: {
      name,
      avatarUrl,
      href: `/${locale}/dashboard/profile`,
      label: dict.nav.profile,
    },
  };
}
