import { formatMoney } from "@/lib/i18n/format";

export type EmailLocale = "en" | "ar";

export const reminderTypes = ["reminder_7", "reminder_3", "reminder_1", "expired"] as const;
export type ReminderType = (typeof reminderTypes)[number];

export const emailTemplates = [
  "welcome",
  "payment_receipt",
  "renewal_confirmation",
  "payment_failed",
  "reminder_7",
  "reminder_3",
  "reminder_1",
  "subscription_expired",
] as const;
export type EmailTemplateName = (typeof emailTemplates)[number];

export type EmailFacts = {
  accountName: string;
  businessName: string;
  planName: string;
  amount: string;
  currency: string;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  reference: string;
  receiptUrl: string;
};

export type EmailContent = {
  template: EmailTemplateName;
  locale: EmailLocale;
  subject: string;
  html: string;
  text: string;
};

const dayMs = 24 * 60 * 60 * 1000;

export function dueReminder(periodEnd: Date, now: Date): ReminderType | null {
  const remaining = periodEnd.getTime() - now.getTime();
  if (!Number.isFinite(remaining)) {
    return null;
  }
  if (remaining <= 0) {
    return "expired";
  }
  if (remaining <= dayMs) {
    return "reminder_1";
  }
  if (remaining <= 3 * dayMs) {
    return "reminder_3";
  }
  if (remaining <= 7 * dayMs) {
    return "reminder_7";
  }
  return null;
}

export function paymentEmailKind(completedCount: number): "payment_receipt" | "renewal_confirmation" {
  return completedCount > 1 ? "renewal_confirmation" : "payment_receipt";
}

export function recordedDelivery(input: { providerMessageId: string | null; error: string | null }): "sent" | "failed" {
  if (input.providerMessageId && !input.error) {
    return "sent";
  }
  return "failed";
}

export function isEmailTemplate(value: string): value is EmailTemplateName {
  return emailTemplates.some((template) => template === value);
}

export function formatEmailWhen(value: string, timeZone: string, locale: EmailLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const zone = validTimeZone(timeZone) ? timeZone : "UTC";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: zone,
  }).format(date);
}

export function emailAmount(amountCents: number, currency: string, locale: EmailLocale): string {
  const formatted = formatMoney(amountCents, currency, locale);
  return formatted ? `${formatted} ${currency}` : currency;
}

function validTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const copy = {
  en: {
    dir: "ltr",
    welcomeSubject: "Welcome to Menor",
    welcomeIntro: "Your Menor account is ready.",
    receiptSubject: "Payment receipt",
    renewalSubject: "Your plan was renewed",
    failedSubject: "Payment was not completed",
    reminderSubject: "Your plan expires soon",
    expiredSubject: "Your plan has expired",
    account: "Account",
    business: "Business",
    plan: "Plan",
    amount: "Amount",
    paid: "Payment date",
    period: "Subscription period",
    expiration: "Expiration",
    reference: "Transaction reference",
    receiptLink: "Open the receipt",
    failedBody: "The payment was not completed, so the plan was not extended.",
    reminderBody: "Pay for another month before the expiration date to keep this plan.",
    expiredBody: "The paid period has ended. Pay for a new month when you want the paid plan again.",
    receiptNotice: "This is a payment receipt for your records. It is not a tax invoice.",
    essential: "This message is about your Menor account or plan. It is not a marketing email.",
  },
  ar: {
    dir: "rtl",
    welcomeSubject: "مرحبًا بك في مينور",
    welcomeIntro: "حسابك في مينور جاهز.",
    receiptSubject: "إيصال دفع",
    renewalSubject: "تم تجديد خطتك",
    failedSubject: "لم تكتمل الدفعة",
    reminderSubject: "خطتك تقترب من الانتهاء",
    expiredSubject: "انتهت خطتك",
    account: "الحساب",
    business: "العمل",
    plan: "الخطة",
    amount: "المبلغ",
    paid: "تاريخ الدفع",
    period: "فترة الاشتراك",
    expiration: "تاريخ الانتهاء",
    reference: "مرجع العملية",
    receiptLink: "فتح الإيصال",
    failedBody: "لم تكتمل الدفعة، لذلك لم تُمدَّد الخطة.",
    reminderBody: "ادفع شهرًا آخر قبل تاريخ الانتهاء للإبقاء على هذه الخطة.",
    expiredBody: "انتهت الفترة المدفوعة. ادفع شهرًا جديدًا عندما تريد الخطة المدفوعة مرة أخرى.",
    receiptNotice: "هذا إيصال دفع لسجلاتك. ليس فاتورة ضريبية.",
    essential: "هذه رسالة عن حسابك أو خطتك في مينور. ليست رسالة تسويقية.",
  },
} as const;

function rows(facts: EmailFacts, labels: (typeof copy)[EmailLocale], includePayment: boolean): Array<[string, string]> {
  const items: Array<[string, string]> = [
    [labels.account, facts.accountName],
    [labels.business, facts.businessName],
    [labels.plan, facts.planName],
  ];
  if (includePayment) {
    items.push(
      [labels.amount, facts.amount],
      [labels.paid, facts.paidAt],
      [labels.reference, facts.reference],
    );
  } else if (facts.amount) {
    items.push([labels.amount, facts.amount]);
  }
  if (facts.periodStart || facts.periodEnd) {
    items.push([labels.period, [facts.periodStart, facts.periodEnd].filter(Boolean).join(" – ")]);
  }
  if (facts.periodEnd) {
    items.push([labels.expiration, facts.periodEnd]);
  }
  return items.filter(([, value]) => value.length > 0);
}

export function renderEmail(
  template: EmailTemplateName,
  locale: EmailLocale,
  facts: EmailFacts,
): EmailContent {
  const labels = copy[locale];
  const paymentTemplate = template === "payment_receipt" || template === "renewal_confirmation";
  const subject = template === "welcome"
    ? labels.welcomeSubject
    : template === "payment_receipt"
      ? labels.receiptSubject
      : template === "renewal_confirmation"
        ? labels.renewalSubject
        : template === "payment_failed"
          ? labels.failedSubject
          : template === "subscription_expired"
            ? labels.expiredSubject
            : labels.reminderSubject;
  const intro = template === "welcome"
    ? labels.welcomeIntro
    : template === "payment_failed"
      ? labels.failedBody
      : template === "subscription_expired"
        ? labels.expiredBody
        : template === "reminder_7" || template === "reminder_3" || template === "reminder_1"
          ? labels.reminderBody
          : labels.receiptNotice;
  const detailRows = rows(facts, labels, paymentTemplate);
  const textLines = [
    subject,
    "",
    intro,
    "",
    ...detailRows.map(([label, value]) => `${label}: ${value}`),
    "",
    paymentTemplate ? labels.receiptNotice : "",
    facts.receiptUrl && paymentTemplate ? `${labels.receiptLink}: ${facts.receiptUrl}` : "",
    "",
    labels.essential,
  ].filter((line) => line.length > 0);

  const detailHtml = detailRows.map(([label, value]) => (
    `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">${escapeHtml(label)}</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:600;text-align:${labels.dir === "rtl" ? "left" : "right"};">${escapeHtml(value)}</td></tr>`
  )).join("");
  const link = facts.receiptUrl && paymentTemplate
    ? `<p style="margin:16px 0 0;"><a href="${escapeHtml(facts.receiptUrl)}" style="color:#ff5a24;font-weight:600;text-decoration:none;">${escapeHtml(labels.receiptLink)}</a></p>`
    : "";
  const notice = paymentTemplate ? `<p>${escapeHtml(labels.receiptNotice)}</p>` : "";
  const html = `<!DOCTYPE html><html lang="${locale}" dir="${labels.dir}"><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="padding:22px 28px;background:#ff5a24;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Menor</td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapeHtml(subject)}</h1>
<p style="margin:0 0 20px;line-height:1.6;color:#334155;">${escapeHtml(intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">${detailHtml}</table>
${notice}
${link}
<p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;line-height:1.5;">${escapeHtml(labels.essential)}</p>
</td></tr></table></td></tr></table></body></html>`;

  return { template, locale, subject, html, text: textLines.join("\n") };
}

export const previewFacts: EmailFacts = {
  accountName: "Nour Haddad",
  businessName: "Harbor Grill",
  planName: "Starter",
  amount: "$19.00 USD",
  currency: "USD",
  paidAt: "13 Oct 2026, 09:00",
  periodStart: "13 Oct 2026, 09:00",
  periodEnd: "13 Nov 2026, 09:00",
  reference: "CAPTURE-PREVIEW",
  receiptUrl: "https://example.com/en/dashboard/businesses/preview/billing/receipts/preview",
};
