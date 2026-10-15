import "server-only";

import { updateTag } from "next/cache";

export const homepageCacheTag = "platform-homepage";
export const publicPlansCacheTag = "public-plans";

export function refreshHomepageCache() {
  updateTag(homepageCacheTag);
  updateTag(publicPlansCacheTag);
}
