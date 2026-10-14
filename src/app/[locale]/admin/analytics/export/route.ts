import { connection } from "next/server";

import { signedAdminMoney } from "@/lib/admin/overview";
import { csvCell } from "@/lib/analytics/present";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";
import { loadAdminFinance } from "@/modules/admin/finance";

type RouteContext = {
  params: Promise<{ locale: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { locale } = await context.params;
  if (!isLocale(locale)) {
    return new Response(null, { status: 404 });
  }
  await connection();

  const url = new URL(request.url);
  const result = await loadAdminFinance({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    now: new Date(),
  });
  if ("denied" in result) {
    return new Response(null, { status: result.status });
  }
  if ("failed" in result || !result.series) {
    return new Response(null, { status: 409 });
  }

  const copy = getDictionary(locale).admin.analyticsPage;
  const lines = [
    [copy.date, copy.currency, copy.collected, copy.refunds, copy.net].map(csvCell).join(","),
  ];
  for (const line of result.series) {
    result.days.forEach((day, index) => {
      const collected = line.collected[index] ?? 0;
      const refunded = line.refunded[index] ?? 0;
      lines.push([
        day,
        line.currency,
        signedAdminMoney(collected, line.currency, locale),
        signedAdminMoney(refunded, line.currency, locale),
        signedAdminMoney(collected - refunded, line.currency, locale),
      ].map(csvCell).join(","));
    });
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="menor-revenue-${result.from}-${result.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
