import type { PosterSizeId } from "./qr-palette";

export type PosterSaveMessage =
  | "idle"
  | "image_too_large"
  | "image_type"
  | "image_failed"
  | "rate_limited"
  | "not_found"
  | "unconfigured"
  | "save_failed"
  | "poster_unready";

export type PosterSaveState =
  | { ok: false; message: PosterSaveMessage }
  | { ok: true; size: PosterSizeId; backgroundUrl: string | null; token: number };

export const idlePosterState: PosterSaveState = { ok: false, message: "idle" };
