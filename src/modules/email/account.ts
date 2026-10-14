import "server-only";

import { renderEmail, type EmailLocale } from "@/lib/email/messages";

import { deliverEmail } from "./deliver";

export async function sendWelcomeEmail(input: {
  userId: string;
  email: string;
  accountName: string;
  locale: EmailLocale;
}): Promise<void> {
  try {
    const content = renderEmail("welcome", input.locale, {
      accountName: input.accountName,
      businessName: "",
      planName: "",
      amount: "",
      currency: "",
      paidAt: "",
      periodStart: "",
      periodEnd: "",
      reference: "",
      receiptUrl: "",
    });
    await deliverEmail({
      idempotencyKey: `welcome:${input.userId}`,
      to: input.email,
      template: content,
      businessId: null,
      subscriptionId: null,
      paymentId: null,
    });
  } catch (error) {
    console.error("Welcome email was not sent.", error);
  }
}
