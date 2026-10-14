import { cronAuthorized } from "@/lib/email/cron";
import { EnvConfigError } from "@/lib/env/error";
import { getServerEnv } from "@/lib/env/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function run(request: Request) {
  let secret = "";
  try {
    secret = getServerEnv().CRON_SECRET;
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return Response.json({ ok: false }, { status: 503 });
    }
    throw error;
  }

  if (secret.trim().length < 16 || !cronAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ ok: false }, { status: secret.trim().length < 16 ? 503 : 401 });
  }

  try {
    const result = await createAdminSupabaseClient().rpc("maintain_public_analytics");
    if (result.error || !result.data || typeof result.data !== "object") {
      return Response.json({ ok: false }, { status: 500 });
    }
    return Response.json({ ok: true, ...result.data });
  } catch (error) {
    console.error("Analytics retention job failed.", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export function GET(request: Request) {
  return run(request);
}

export function POST(request: Request) {
  return run(request);
}
