import { isLocale } from "@/lib/i18n/locales";
import { menuQrPng } from "@/lib/menus/qr-code";
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
  const png = await menuQrPng(loaded.url, draw, draw.style);
  if (!png) {
    return new Response(null, { status: 404 });
  }

  const body = new ArrayBuffer(png.byteLength);
  new Uint8Array(body).set(png);

  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${qrFileName(loaded.business, "png")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
