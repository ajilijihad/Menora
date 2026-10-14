import "server-only";

import { mergePlanCards, readHomepage, type HomepageContent, type PublicPlan } from "@/lib/homepage/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loadHomepage(): Promise<{ content: HomepageContent; stored: boolean; valid: boolean; unavailable: boolean }> {
  const fallback = readHomepage(null);
  try {
    const supabase = await createServerSupabaseClient();
    const result = await supabase.from("platform_homepage").select("content").eq("singleton", true).maybeSingle();
    if (result.error) {
      return { content: fallback.content, stored: false, valid: false, unavailable: true };
    }
    if (!result.data) {
      return { content: fallback.content, stored: false, valid: true, unavailable: false };
    }
    const parsed = readHomepage(result.data.content);
    return { content: parsed.content, stored: true, valid: parsed.valid, unavailable: false };
  } catch {
    return { content: fallback.content, stored: false, valid: false, unavailable: true };
  }
}

export async function loadPublicPlans(): Promise<PublicPlan[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const result = await supabase
      .from("subscription_plans")
      .select("id, code, name, description, amount_cents, currency, is_active, max_businesses, max_products, max_themes, analytics_retention_days, custom_domains")
      .eq("is_active", true)
      .order("amount_cents");
    if (result.error || !result.data) {
      return [];
    }
    return result.data.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      amountCents: plan.amount_cents,
      currency: plan.currency,
      maxBusinesses: plan.max_businesses,
      maxProducts: plan.max_products,
      maxThemes: plan.max_themes,
      analyticsRetentionDays: plan.analytics_retention_days,
      customDomains: plan.custom_domains,
    }));
  } catch {
    return [];
  }
}

export async function loadHomepageForEditor(): Promise<{ content: HomepageContent; plans: PublicPlan[]; stored: boolean; valid: boolean; unavailable: boolean }> {
  const [page, plans] = await Promise.all([loadHomepage(), loadPublicPlans()]);
  return { ...page, content: mergePlanCards(page.content, plans), plans };
}
