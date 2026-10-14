import { createRateLimiter, type RateLimitRule } from "@/lib/auth/rate-limit";

const fifteenMinutes = 15 * 60 * 1000;

export const businessRateLimits = {
  write: { limit: 30, windowMs: fifteenMinutes },
  remove: { limit: 10, windowMs: fifteenMinutes },
} as const satisfies Record<string, RateLimitRule>;

export const businessRateLimiter = createRateLimiter();
