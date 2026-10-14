import "server-only";

import { canEditMenu } from "@/lib/businesses/access";
import { parseBusinessId } from "@/lib/businesses/ids";
import { EnvConfigError } from "@/lib/env/error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMyBusiness } from "@/modules/businesses/queries";

export async function requireMenu(businessId: string) {
  const id = parseBusinessId(businessId);
  if (!id) {
    return null;
  }

  const business = await getMyBusiness(id);
  if (!business || business.id !== id || !canEditMenu(business.role)) {
    return null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    return { unconfigured: false as const, business, supabase };
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return { unconfigured: true as const, business, supabase: null };
    }

    throw error;
  }
}
