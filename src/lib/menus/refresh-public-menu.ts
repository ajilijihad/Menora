import "server-only";

import { updateTag } from "next/cache";

import { publicMenuTag } from "./public-menu";

export function refreshPublicMenu(slug: string) {
  if (!slug) {
    return;
  }

  updateTag(publicMenuTag(slug));
}
