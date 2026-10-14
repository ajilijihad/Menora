import { NextResponse, type NextRequest } from "next/server";

import { resolveAuthCallback } from "@/lib/auth/callback";
import { clientIpFromForwarded } from "@/lib/auth/ip";
import { localeOfPath } from "@/lib/auth/paths";
import { authRateLimiter, authRateLimits } from "@/lib/auth/rate-limit";
import { LOCALE_COOKIE, preferredLocale } from "@/lib/i18n/locales";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const fallback = preferredLocale(
    request.cookies.get(LOCALE_COOKIE)?.value,
    request.headers.get("accept-language"),
  );
  const origin = request.nextUrl.origin;
  const ip = clientIpFromForwarded(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
  const limited = authRateLimiter.consume(`confirm:${ip}`, authRateLimits.confirm);

  if (!limited.ok) {
    return NextResponse.redirect(new URL(`/${fallback}/login?error=rate_limited`, origin));
  }

  const resolved = resolveAuthCallback({
    tokenHash: request.nextUrl.searchParams.get("token_hash"),
    type: request.nextUrl.searchParams.get("type"),
    code: request.nextUrl.searchParams.get("code"),
    next: request.nextUrl.searchParams.get("next"),
  });

  if (resolved.kind === "invalid") {
    return NextResponse.redirect(new URL(`/${fallback}/login?error=verify_failed`, origin));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } =
      resolved.kind === "otp"
        ? await supabase.auth.verifyOtp({
            type: resolved.type,
            token_hash: resolved.tokenHash,
          })
        : await supabase.auth.exchangeCodeForSession(resolved.code);

    if (error) {
      const locale = localeOfPath(resolved.next, fallback);
      return NextResponse.redirect(new URL(`/${locale}/login?error=verify_failed`, origin));
    }

    return NextResponse.redirect(new URL(resolved.next, origin));
  } catch (error) {
    console.error("Unable to complete the auth confirmation.", error);
    return NextResponse.redirect(new URL(`/${fallback}/login?error=unconfigured`, origin));
  }
}
