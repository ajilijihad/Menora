import "server-only";

import { publicMediaUrl } from "@/lib/businesses/media";
import type { BusinessRecord } from "@/lib/businesses/record";
import { getPublicEnv } from "@/lib/env/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMyBusiness } from "@/modules/businesses/queries";

import { menuQrTarget } from "./qr-code";
import { posterSizeFromValue, type PosterSizeId } from "./qr-palette";

export async function loadMenuQr(businessId: string) {
  const business = await getMyBusiness(businessId);
  if (!business) {
    return null;
  }

  const env = getPublicEnv();
  const url = menuQrTarget(business.slug, env.NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development");
  return {
    business,
    url,
    logoUrl: publicMediaUrl(env.NEXT_PUBLIC_SUPABASE_URL, business.logoPath),
  };
}

export type MenuPosterSettings = {
  size: PosterSizeId;
  backgroundUrl: string | null;
};

export async function loadMenuPoster(businessId: string): Promise<MenuPosterSettings> {
  const fallback: MenuPosterSettings = { size: "a5", backgroundUrl: null };
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("businesses")
      .select("poster_size, poster_background_path")
      .eq("id", businessId)
      .maybeSingle();
    if (error || !data) {
      return fallback;
    }

    const path = typeof data.poster_background_path === "string" ? data.poster_background_path : null;
    return {
      size: posterSizeFromValue(data.poster_size),
      backgroundUrl: publicMediaUrl(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, path),
    };
  } catch {
    return fallback;
  }
}

export function qrFileName(business: BusinessRecord, extension: "png" | "svg") {
  return `${business.slug}-menu.${extension}`;
}

export function qrPosterFileName(business: BusinessRecord) {
  return `${business.slug}-menu-poster.svg`;
}
