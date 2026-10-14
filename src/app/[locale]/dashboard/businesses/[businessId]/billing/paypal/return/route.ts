import { NextResponse, type NextRequest } from "next/server";

import { isLocale } from "@/lib/i18n/locales";
import { captureOwnedPayment } from "@/modules/billing/paypal";
import { getAuthenticatedUser } from "@/modules/auth";
import { getMyBusiness } from "@/modules/businesses/queries";

type ReturnContext = {
  params: Promise<{ locale: string; businessId: string }>;
};

export async function GET(request: NextRequest, context: ReturnContext) {
  const { locale, businessId } = await context.params;
  if (!isLocale(locale)) {
    return NextResponse.redirect(new URL("/en", request.nextUrl.origin));
  }

  const billing = `/${locale}/dashboard/billing`;
  const token = request.nextUrl.searchParams.get("token");
  if (!token || token.length > 80) {
    return NextResponse.redirect(new URL(`${billing}?notice=payment_failed`, request.nextUrl.origin));
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    const next = `/${locale}/dashboard/businesses/${businessId}/billing/paypal/return?token=${encodeURIComponent(token)}`;
    return NextResponse.redirect(new URL(`/${locale}/login?next=${encodeURIComponent(next)}`, request.nextUrl.origin));
  }

  const business = await getMyBusiness(businessId);
  if (!business || business.role !== "owner") {
    return NextResponse.redirect(new URL(`${billing}?notice=forbidden`, request.nextUrl.origin));
  }

  const result = await captureOwnedPayment({ businessId: business.id, orderId: token });
  const notice = result === "paid" ? "paid" : result === "unconfigured" ? "unconfigured" : "payment_failed";
  return NextResponse.redirect(new URL(`${billing}?notice=${notice}`, request.nextUrl.origin));
}
