import type { MetadataRoute } from "next";

import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { sitemapOrigin } from "@/lib/seo/public-metadata";

const hidden = [
  "/api/",
  "/auth/",
  "/*/dashboard",
  "/*/admin",
  "/*/login",
  "/*/register",
  "/*/forgot-password",
  "/*/reset-password",
  "/*/verify-email",
];

export default function robots(): MetadataRoute.Robots {
  let sitemap: string | undefined;
  try {
    const origin = sitemapOrigin(getPublicEnv().NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development");
    sitemap = origin ? `${origin}/sitemap.xml` : undefined;
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      throw error;
    }
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: hidden },
    sitemap,
  };
}
