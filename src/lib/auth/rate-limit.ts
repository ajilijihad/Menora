export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

const fifteenMinutes = 15 * 60 * 1000;

export const authRateLimits = {
  register: { limit: 5, windowMs: fifteenMinutes },
  login: { limit: 10, windowMs: fifteenMinutes },
  forgot: { limit: 5, windowMs: fifteenMinutes },
  reset: { limit: 5, windowMs: fifteenMinutes },
  profile: { limit: 20, windowMs: fifteenMinutes },
  confirm: { limit: 30, windowMs: fifteenMinutes },
  resend: { limit: 3, windowMs: fifteenMinutes },
} as const satisfies Record<string, RateLimitRule>;

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * In-memory limits for one server process. A multi-instance deployment needs
 * a shared store. Supabase Auth applies its own limits as well.
 */
export function createRateLimiter(now: () => number = Date.now) {
  const buckets = new Map<string, Bucket>();

  return {
    consume(key: string, rule: RateLimitRule): RateLimitResult {
      const current = now();
      const existing = buckets.get(key);

      if (!existing || existing.resetAt <= current) {
        buckets.set(key, { count: 1, resetAt: current + rule.windowMs });
        return { ok: true };
      }

      if (existing.count >= rule.limit) {
        return {
          ok: false,
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - current) / 1000)),
        };
      }

      existing.count += 1;
      return { ok: true };
    },
  };
}

export const authRateLimiter = createRateLimiter();
