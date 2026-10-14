import { createRateLimiter, type RateLimitRule } from "@/lib/auth/rate-limit";

const fifteenMinutes = 15 * 60 * 1000;

export const menuRateLimits = {
  write: { limit: 60, windowMs: fifteenMinutes },
  remove: { limit: 20, windowMs: fifteenMinutes },
} as const satisfies Record<string, RateLimitRule>;

export const menuRateLimiter = createRateLimiter();
