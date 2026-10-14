export function clientIpFromForwarded(
  forwardedFor: string | null | undefined,
  realIp: string | null | undefined,
): string {
  const firstHop = forwardedFor?.split(",")[0]?.trim();
  if (firstHop) {
    return firstHop;
  }

  const real = realIp?.trim();
  return real ? real : "unknown";
}
