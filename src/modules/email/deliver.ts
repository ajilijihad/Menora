import "server-only";

import { EnvConfigError } from "@/lib/env/error";
import { getServerEnv } from "@/lib/env/server";
import { recordedDelivery, type EmailContent } from "@/lib/email/messages";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createEmailClient } from "./index";

type DeliveryInput = {
  idempotencyKey: string;
  to: string;
  template: EmailContent;
  businessId: string | null;
  subscriptionId: string | null;
  paymentId: string | null;
};

export async function deliverEmail(input: DeliveryInput): Promise<"sent" | "failed" | "duplicate"> {
  let admin: ReturnType<typeof createAdminSupabaseClient>;
  try {
    admin = createAdminSupabaseClient();
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return "failed";
    }
    throw error;
  }

  const claimed = await admin.rpc("claim_email_delivery", {
    target_key: input.idempotencyKey,
    target_email: input.to,
    target_template: input.template.template,
    target_business: input.businessId,
    target_subscription: input.subscriptionId,
    target_payment: input.paymentId,
  });
  if (claimed.error || !claimed.data) {
    return claimed.error ? "failed" : "duplicate";
  }

  const logId = claimed.data;
  let from = "";
  try {
    from = getServerEnv().RESEND_FROM_EMAIL;
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      throw error;
    }
  }
  if (!from) {
    await finish(admin, logId, "failed", null, "Resend from address is not configured");
    return "failed";
  }

  try {
    const result = await createEmailClient().emails.send(
      {
        from,
        to: input.to,
        subject: input.template.subject,
        html: input.template.html,
        text: input.template.text,
      },
      { idempotencyKey: input.idempotencyKey },
    );
    const messageId = result.data?.id ?? null;
    const error = result.error?.message ?? null;
    const status = recordedDelivery({ providerMessageId: messageId, error });
    await finish(admin, logId, status, messageId, error);
    return status;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed";
    await finish(admin, logId, "failed", null, message);
    return "failed";
  }
}

async function finish(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  logId: string,
  status: "sent" | "failed",
  providerMessageId: string | null,
  error: string | null,
) {
  await admin.rpc("finish_email_delivery", {
    target_id: logId,
    target_status: status,
    target_provider_id: providerMessageId ?? "",
    target_error: error ?? "",
  });
}
