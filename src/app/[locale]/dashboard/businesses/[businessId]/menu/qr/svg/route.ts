import { isLocale } from "@/lib/i18n/locales";
import { menuQrStyledSvg } from "@/lib/menus/qr-code";
import { qrDrawFromSearch } from "@/lib/menus/qr-style";
import { loadMenuQr, qrFileName } from "@/lib/menus/qr-access";

type RouteContext = {
  params: Promise<{ locale: string; businessId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { locale, businessId } = await context.params;
  if (!isLocale(locale)) {
    return new Response(null, { status: 404 });
  }

  const loaded = await loadMenuQr(businessId);
  if (!loaded?.url) {
    return new Response(null, { status: 404 });
  }

  const draw = qrDrawFromSearch(new URL(request.url).searchParams);
  const svg = menuQrStyledSvg(loaded.url, { ...draw, logoHref: draw.style === "logo" ? loaded.logoUrl : null });
  if (!svg) {
    return new Response(null, { status: 404 });
  }

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${qrFileName(loaded.business, "svg")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
