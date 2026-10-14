"use server";

import { redirect } from "next/navigation";

import { parseLocale } from "@/lib/auth/schemas";
import { isEmailTemplate, previewFacts, renderEmail, type EmailLocale } from "@/lib/email/messages";
import { requirePlatformAdmin } from "@/modules/admin/guard";
import { getOwnProfile } from "@/modules/auth";

import { deliverEmail } from "./deliver";

export async function sendPreviewEmailAction(formData: FormData): Promise<void> {
  const locale = parseLocale(formData.get("locale"));
  const templateValue = String(formData.get("template") ?? "");
  const emailLocale: EmailLocale = formData.get("emailLocale") === "ar" ? "ar" : "en";
  if (!locale || !isEmailTemplate(templateValue)) {
    return;
  }

  const access = await requirePlatformAdmin();
  const profile = await getOwnProfile();
  if (!access.ok || !profile?.email) {
    redirect(`/${locale}/admin?notice=forbidden`);
  }

  const result = await deliverEmail({
    idempotencyKey: `preview:${access.userId}:${templateValue}:${emailLocale}:${crypto.randomUUID()}`,
    to: profile.email,
    template: renderEmail(templateValue, emailLocale, previewFacts),
    businessId: null,
    subscriptionId: null,
    paymentId: null,
  });
  const notice = result === "sent" ? "test_sent" : "test_failed";
  redirect(`/${locale}/admin/email?template=${templateValue}&emailLocale=${emailLocale}&notice=${notice}`);
}
