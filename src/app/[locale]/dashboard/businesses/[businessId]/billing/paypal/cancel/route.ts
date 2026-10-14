import { NextResponse, type NextRequest } from "next/server";

import { isLocale } from "@/lib/i18n/locales";
import { cancelOwnedPayment } from "@/modules/billing/paypal";
import { getAuthenticatedUser } from "@/modules/auth";
import { getMyBusiness } from "@/modules/businesses/queries";

type CancelContext = {
  params: Promise<{ locale: string; businessId: string }>;
};

const paymentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, context: CancelContext) {
  const { locale, businessId } = await context.params;
  if (!isLocale(locale)) {
    return NextResponse.redirect(new URL("/en", request.nextUrl.origin));
  }

  const billing = `/${locale}/dashboard/billing`;
  const paymentId = request.nextUrl.searchParams.get("payment");
  const user = await getAuthenticatedUser();
  if (!user) {
    const next = paymentId
      ? `/${locale}/dashboard/businesses/${businessId}/billing/paypal/cancel?payment=${encodeURIComponent(paymentId)}`
      : `/${locale}/dashboard/businesses/${businessId}/billing/paypal/cancel`;
    return NextResponse.redirect(new URL(`/${locale}/login?next=${encodeURIComponent(next)}`, request.nextUrl.origin));
  }

  const business = await getMyBusiness(businessId);
  if (!business || business.role !== "owner" || !paymentId || !paymentIdPattern.test(paymentId)) {
    return NextResponse.redirect(new URL(`${billing}?notice=checkout_canceled`, request.nextUrl.origin));
  }

  await cancelOwnedPayment({ businessId: business.id, paymentId });
  return NextResponse.redirect(new URL(`${billing}?notice=checkout_canceled`, request.nextUrl.origin));
}
