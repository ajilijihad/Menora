import "server-only";

import { getAuthenticatedUser } from "@/modules/auth";
import { isBusinessRole, type BusinessRole } from "@/lib/businesses/access";
import { parseBusinessId } from "@/lib/businesses/ids";
import type { BusinessRecord } from "@/lib/businesses/record";
import {
  businessTypes,
  parseOpeningHours,
  parseSocialLinks,
  type BusinessType,
} from "@/lib/businesses/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const businessColumns =
  "id, name, slug, business_type, description, phone, address, map_url, opening_hours, social_links, default_language, time_zone, logo_path, cover_path, status, is_published";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  map_url: string | null;
  opening_hours: unknown;
  social_links: unknown;
  default_language: string;
  time_zone: string;
  logo_path: string | null;
  cover_path: string | null;
  status: string;
  is_published: boolean;
};

function oneBusiness(value: BusinessRow | BusinessRow[] | null): BusinessRow | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function businessType(value: string): BusinessType {
  return businessTypes.find((type) => type === value) ?? "other";
}

function businessStatus(value: string): BusinessRecord["status"] {
  if (value === "active" || value === "archived" || value === "draft") {
    return value;
  }

  return "draft";
}

function toRecord(role: BusinessRole, row: BusinessRow): BusinessRecord {
  return {
    id: row.id,
    role,
    name: row.name,
    slug: row.slug,
    businessType: businessType(row.business_type),
    description: row.description,
    phone: row.phone,
    address: row.address,
    mapUrl: row.map_url,
    openingHours: parseOpeningHours(row.opening_hours),
    socialLinks: parseSocialLinks(row.social_links),
    defaultLanguage: row.default_language === "ar" ? "ar" : "en",
    timeZone: row.time_zone,
    logoPath: row.logo_path,
    coverPath: row.cover_path,
    status: businessStatus(row.status),
    isPublished: row.is_published,
  };
}

export async function listMyBusinesses(): Promise<BusinessRecord[]> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("business_members")
    .select(`role, businesses(${businessColumns})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const businesses: BusinessRecord[] = [];
  for (const member of data ?? []) {
    const row = oneBusiness(member.businesses as BusinessRow | BusinessRow[] | null);
    if (!row || !isBusinessRole(member.role)) {
      continue;
    }

    businesses.push(toRecord(member.role, row));
  }

  return businesses;
}

export type BusinessCardStats = {
  users: number | null;
  scans: number | null;
  categories: number | null;
  products: number | null;
};

const emptyCardStats: BusinessCardStats = { users: null, scans: null, categories: null, products: null };

async function exactCount(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number | null> {
  try {
    const result = await query;
    if (result.error) {
      return null;
    }
    return result.count ?? 0;
  } catch {
    return null;
  }
}

export async function loadBusinessCardStats(businessIds: string[]): Promise<Map<string, BusinessCardStats>> {
  const stats = new Map<string, BusinessCardStats>();
  for (const id of businessIds) {
    stats.set(id, emptyCardStats);
  }
  if (businessIds.length === 0) {
    return stats;
  }

  const supabase = await createServerSupabaseClient();
  await Promise.all(
    businessIds.map(async (id) => {
      const [users, scans, categories, products] = await Promise.all([
        exactCount(supabase.from("business_members").select("id", { count: "exact", head: true }).eq("business_id", id)),
        exactCount(
          supabase
            .from("analytics_events")
            .select("id", { count: "exact", head: true })
            .eq("business_id", id)
            .eq("event_name", "menu_view"),
        ),
        exactCount(supabase.from("menu_categories").select("id", { count: "exact", head: true }).eq("business_id", id)),
        exactCount(supabase.from("menu_products").select("id", { count: "exact", head: true }).eq("business_id", id)),
      ]);
      stats.set(id, { users, scans, categories, products });
    }),
  );
  return stats;
}

export async function getMyBusiness(businessId: string): Promise<BusinessRecord | null> {
  const id = parseBusinessId(businessId);
  const user = await getAuthenticatedUser();
  if (!id || !user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("business_members")
    .select(`role, businesses(${businessColumns})`)
    .eq("user_id", user.id)
    .eq("business_id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = oneBusiness((data?.businesses ?? null) as BusinessRow | BusinessRow[] | null);
  if (!data || !row || !isBusinessRole(data.role)) {
    return null;
  }

  return toRecord(data.role, row);
}
