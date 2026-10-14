import Link from "next/link";
import { headers } from "next/headers";

import { BrandLockup } from "@/components/brand-lockup";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { localizedText } from "@/lib/homepage/schema";
import { hasAuthSessionCookie } from "@/lib/auth/session-cookie";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isPublicMenuPath, localeFromPathname, type Locale } from "@/lib/i18n/locales";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/modules/auth";
import { signOutAction } from "@/modules/auth/actions";
import { loadHomepage } from "@/modules/homepage/queries";

type SiteHeaderProps = {
  locale: Locale;
};

function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "ar" : "en";
}

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
  const headerStore = await headers();
  const currentPath = headerStore.get("x-menor-pathname") ?? `/${locale}`;
  if (isPublicMenuPath(currentPath) || /\/login(?:\/|$)/.test(currentPath)) {
    return <header className="hidden" />;
  }

  const currentSearch = headerStore.get("x-menor-search") ?? "";
  const targetLocale = otherLocale(locale);
  const switchedPath = `${
    localeFromPathname(currentPath)
      ? currentPath.replace(/^\/(en|ar)/, `/${targetLocale}`)
      : `/${targetLocale}`
  }${currentSearch.startsWith("?") ? currentSearch : ""}`;

  let user: Awaited<ReturnType<typeof getAuthenticatedUser>> = null;
  let isAdmin = false;
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

  let signedIn = false;
  try {
    user = await getAuthenticatedUser();
    signedIn = Boolean(user) || (await hasAuthSessionCookie());
    if (user) {
      const supabase = await createServerSupabaseClient();
      const appointed = await supabase.rpc("is_platform_admin");
      isAdmin = appointed.data === true;
    }
  } catch {
    user = null;
    signedIn = await hasAuthSessionCookie().catch(() => false);
  }

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3">
        <Link href={`/${locale}`} className="text-sm tracking-tight">
          <BrandLockup name={siteName} logoUrl={logoUrl} />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href={switchedPath}>{dict.language.switchTo}</Link>
          {signedIn ? (
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
          ) : (
            <>
              <Link href={`/${locale}/login`}>{dict.nav.login}</Link>
              <Link href={`/${locale}/register`}>{dict.nav.register}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
