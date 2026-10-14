import { EnvConfigError } from "@/lib/env/error";
import { getServerEnv } from "@/lib/env/server";
import { cronAuthorized } from "@/lib/email/cron";
import { runReminderJob } from "@/modules/email/reminders";

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

  if (secret.trim().length < 16) {
    return Response.json({ ok: false }, { status: 503 });
  }

  if (!cronAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    const result = await runReminderJob(new Date());
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Subscription reminder job failed.", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export function GET(request: Request) {
  return run(request);
}

export function POST(request: Request) {
  return run(request);
}
