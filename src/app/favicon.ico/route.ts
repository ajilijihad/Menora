import { readFile } from "node:fs/promises";
import path from "node:path";

import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { homepageImageUrl } from "@/lib/homepage/media";
import { loadHomepage } from "@/modules/homepage/queries";

export async function GET() {
  const page = await loadHomepage();
  let url: string | null = null;
  try {
    url = homepageImageUrl(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, page.content.site.iconPath);
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      throw error;
    }
  }

  if (url) {
    const upstream = await fetch(url);
    if (upstream.ok) {
      const type = upstream.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
      return new Response(await upstream.arrayBuffer(), {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      });
    }
  }

  const file = await readFile(path.join(process.cwd(), "public", "brand-favicon.ico"));
  return new Response(file, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
