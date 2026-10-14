import { csvCell } from "@/lib/analytics/present";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";
import { loadAnalyticsSummary } from "@/modules/analytics/queries";

type RouteContext = {
  params: Promise<{ locale: string; businessId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { locale, businessId } = await context.params;
  if (!isLocale(locale)) {
    return new Response(null, { status: 404 });
  }

  const url = new URL(request.url);
  const result = await loadAnalyticsSummary(businessId, url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined);
  if (!result.ok) {
    return new Response(null, { status: result.reason === "invalid" ? 400 : 404 });
  }

  const copy = getDictionary(locale).insights;
  const lines = [
    [copy.day, copy.menuViews, copy.productViews].map(csvCell).join(","),
    ...result.summary.days.map((day) => [day.day, day.menu, day.product].map(csvCell).join(",")),
  ];
  const body = `\uFEFF${lines.join("\r\n")}\r\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="menor-analytics-${result.pageFrom}-${result.pageTo}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
