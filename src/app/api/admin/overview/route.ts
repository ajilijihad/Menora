import { adminAccessStatus } from "@/lib/admin/list";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/modules/auth";
import { loadAdminMetrics } from "@/modules/admin/queries";

export async function GET() {
  const user = await getAuthenticatedUser();
  let appointed = false;
  if (user) {
    const supabase = await createServerSupabaseClient();
    const result = await supabase.rpc("is_platform_admin");
    appointed = result.data === true;
  }

  const status = adminAccessStatus({ userId: user?.id ?? null, appointed });
  if (status !== 200) {
    return Response.json({ ok: false }, { status });
  }

  const metrics = await loadAdminMetrics();
  if ("denied" in metrics || "failed" in metrics) {
    return Response.json({ ok: false }, { status: "denied" in metrics ? 403 : 500 });
  }

  return Response.json({ ok: true, ...metrics });
}
