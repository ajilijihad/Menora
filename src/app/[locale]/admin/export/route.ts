import { csvCell } from "@/lib/analytics/present";
import { formatAdminMoney } from "@/lib/admin/overview";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";
import { loadAdminOverview } from "@/modules/admin/queries";

type RouteContext = {
  params: Promise<{ locale: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { locale } = await context.params;
  if (!isLocale(locale)) {
    return new Response(null, { status: 404 });
  }

  const url = new URL(request.url);
  const overview = await loadAdminOverview({
    range: url.searchParams.get("range") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    now: new Date(),
  });
  if ("denied" in overview) {
    return new Response(null, { status: overview.status });
  }
  if ("failed" in overview || overview.businessSeries === null || overview.userSeries === null) {
    return new Response(null, { status: 500 });
  }

  const copy = getDictionary(locale).admin;
  const lines = [
    [copy.columnDate, copy.newBusinesses, copy.newUsers].map(csvCell).join(","),
    ...overview.days.map((day, index) => [day, overview.businessSeries?.[index] ?? 0, overview.userSeries?.[index] ?? 0].map(csvCell).join(",")),
  ];
  if (overview.revenue && overview.revenue.length > 0) {
    lines.push([copy.revenue, copy.columns.amount].map(csvCell).join(","));
    for (const entry of overview.revenue) {
      lines.push([entry.currency, formatAdminMoney(entry.amountCents, entry.currency, locale)].map(csvCell).join(","));
    }
  }

  return new Response(`\uFEFF${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="menor-admin-${overview.from}-${overview.to}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
