import Link from "next/link";
import { Suspense } from "react";

import { SiteHeaderBar } from "@/components/site-header-bar";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { localizedText } from "@/lib/homepage/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { getAuthenticatedUser, getOwnProfile } from "@/modules/auth";
import { signOutAction } from "@/modules/auth/actions";
import { loadHomepage } from "@/modules/homepage/queries";

type SiteHeaderProps = {
  locale: Locale;
};

export function HeaderFallback({ locale }: SiteHeaderProps) {
  const dict = getDictionary(locale);

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex min-h-14 w-full max-w-5xl items-center px-6">
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

  return (
    <SiteHeaderBar locale={locale} siteName={siteName} logoUrl={logoUrl} languageLabel={dict.language.switchTo}>
      <Suspense fallback={<GuestNav locale={locale} />}>
        <SiteHeaderAuth locale={locale} />
      </Suspense>
    </SiteHeaderBar>
  );
}

function GuestNav({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <>
      <Link href={`/${locale}/login`}>{dict.nav.login}</Link>
      <Link href={`/${locale}/register`}>{dict.nav.register}</Link>
    </>
  );
}

async function SiteHeaderAuth({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  let signedIn = false;
  let isAdmin = false;
  try {
    const user = await getAuthenticatedUser();
    signedIn = Boolean(user);
    if (user) {
      const profile = await getOwnProfile();
      isAdmin = profile?.is_platform_admin === true;
    }
  } catch {
    signedIn = false;
  }

  if (!signedIn) {
    return <GuestNav locale={locale} />;
  }

  return (
    <>
      <Link href={`/${locale}/dashboard`}>{dict.nav.dashboard}</Link>
      <Link href={`/${locale}/dashboard/profile`}>{dict.nav.profile}</Link>
      {isAdmin ? <Link href={`/${locale}/admin`}>{dict.nav.admin}</Link> : null}
      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="font-medium">
          {dict.nav.logout}
        </button>
      </form>
    </>
  );
}
