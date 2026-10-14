import { EnvConfigError } from "@/lib/env/error";
import { PayPalRequestError, applyPayPalWebhook } from "@/modules/billing/paypal";

export async function POST(request: Request) {
  let event: unknown;
  try {
    event = JSON.parse(await request.text());
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    const result = await applyPayPalWebhook({
      event,
      headers: {
        authAlgo: request.headers.get("paypal-auth-algo"),
        certUrl: request.headers.get("paypal-cert-url"),
        transmissionId: request.headers.get("paypal-transmission-id"),
        transmissionSig: request.headers.get("paypal-transmission-sig"),
        transmissionTime: request.headers.get("paypal-transmission-time"),
      },
    });
    if (result === "unauthorized") {
      return Response.json({ ok: false }, { status: 401 });
    }
    if (result === "unconfigured") {
      return Response.json({ ok: false }, { status: 503 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof PayPalRequestError) {
      return Response.json({ ok: false }, { status: 401 });
    }
    if (error instanceof EnvConfigError) {
      return Response.json({ ok: false }, { status: 503 });
    }
    return Response.json({ ok: false }, { status: 500 });
  }
}
