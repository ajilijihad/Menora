import { createHash, timingSafeEqual } from "node:crypto";

export function cronAuthorized(authorization: string | null, secret: string): boolean {
  if (secret.trim().length < 16 || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const presented = authorization.slice("Bearer ".length);
  const left = createHash("sha256").update(presented).digest();
  const right = createHash("sha256").update(secret).digest();
  return timingSafeEqual(left, right);
}
