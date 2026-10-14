const businessIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function parseBusinessId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const id = value.trim().toLowerCase();
  return businessIdPattern.test(id) ? id : null;
}

export function businessIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/dashboard\/businesses\/([0-9a-f-]{36})(?:\/|$)/i);
  return parseBusinessId(match?.[1]);
}
