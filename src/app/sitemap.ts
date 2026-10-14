import type { MetadataRoute } from "next";

import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { isPublicSlug } from "@/lib/businesses/slug";
import { sitemapOrigin } from "@/lib/seo/public-metadata";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let origin: string | null = null;
  try {
    const env = getPublicEnv();
    origin = sitemapOrigin(env.NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development");
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return [];
    }
    throw error;
  }

  if (!origin) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [
    { url: `${origin}/en`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${origin}/ar`, changeFrequency: "weekly", priority: 0.4 },
  ];

  try {
    const supabase = createPublicSupabaseClient();
    const result = await supabase.from("public_businesses").select("slug").limit(5000);
    for (const row of result.data ?? []) {
      if (row.slug && isPublicSlug(row.slug)) {
        entries.push({
          url: `${origin}/menu/${row.slug}`,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      console.error("Published menu sitemap could not be loaded.", error);
    }
  }

  return entries;
}
