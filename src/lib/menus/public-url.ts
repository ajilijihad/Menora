import { isPublicSlug } from "@/lib/businesses/slug";

const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

export function appOrigin(appUrl: string, nodeEnv: string): string | null {
  let url: URL;
  try {
    url = new URL(appUrl);
  } catch {
    return null;
  }

  if (url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const local = localHosts.has(host) || host.endsWith(".local");
  if (nodeEnv === "production") {
    if (url.protocol !== "https:" || local) {
      return null;
    }
  } else if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  return url.origin;
}

export function canonicalMenuUrl(slug: string, appUrl: string, nodeEnv: string): string | null {
  if (!isPublicSlug(slug)) {
    return null;
  }

  const origin = appOrigin(appUrl, nodeEnv);
  return origin ? `${origin}/menu/${slug}` : null;
}
