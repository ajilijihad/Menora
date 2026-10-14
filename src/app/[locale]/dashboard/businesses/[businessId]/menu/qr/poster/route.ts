import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";
import { menuQrStyledSvg } from "@/lib/menus/qr-code";
import { loadMenuPoster, loadMenuQr, qrPosterFileName } from "@/lib/menus/qr-access";
import { posterSvg } from "@/lib/menus/qr-palette";
import { qrDrawFromSearch } from "@/lib/menus/qr-style";

type RouteContext = {
  params: Promise<{ locale: string; businessId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { locale, businessId } = await context.params;
  if (!isLocale(locale)) {
    return new Response(null, { status: 404 });
  }

  const loaded = await loadMenuQr(businessId);
  if (!loaded?.url) {
    return new Response(null, { status: 404 });
  }

  const copy = getDictionary(locale).qr;
  const draw = qrDrawFromSearch(new URL(_request.url).searchParams);
  const poster = await loadMenuPoster(loaded.business.id);
  const qr = menuQrStyledSvg(loaded.url, { ...draw, logoHref: draw.style === "logo" ? loaded.logoUrl : null });
  const svg = qr
    ? posterSvg(qr, loaded.business.name, copy.posterScan, loaded.url, {
        size: poster.size,
        backgroundHref: poster.backgroundUrl,
        logoHref: loaded.logoUrl,
      })
    : null;
  if (!svg) {
    return new Response(null, { status: 404 });
  }

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${qrPosterFileName(loaded.business)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
