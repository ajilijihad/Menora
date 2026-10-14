import { notFound, redirect } from "next/navigation";

import { isLocale } from "@/lib/i18n/locales";

type BillingRedirectProps = {
  params: Promise<{ locale: string; businessId: string }>;
};

export default async function BusinessBillingRedirect({ params }: BillingRedirectProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  redirect(`/${locale}/dashboard/billing`);
}
