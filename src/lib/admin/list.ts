export const adminPageSize = 20;

const searchable = /[%_,()"\\]/g;

export function adminPage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10000) {
    return 1;
  }
  return parsed;
}

export function adminSearch(value: string | undefined): string {
  return (value ?? "").replace(searchable, "").trim().slice(0, 80);
}

export function ilikeContains(term: string): string {
  return `%${term.replace(/[%_]/g, "")}%`;
}

export function allowedFilter<T extends string>(value: string | undefined, allowed: readonly T[]): T | "all" {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : "all";
}

export function pageRange(page: number, size = adminPageSize): { from: number; to: number } {
  const safePage = adminPage(String(page));
  const from = (safePage - 1) * size;
  return { from, to: from + size - 1 };
}

export function adminListSize(value: string | undefined): number {
  const parsed = Number(value);
  if (parsed === 10 || parsed === 20 || parsed === 50) {
    return parsed;
  }
  return adminPageSize;
}

export function adminHref(
  pathname: string,
  input: { q?: string; status?: string; page?: number; currency?: string; size?: number },
): string {
  const params = new URLSearchParams();
  if (input.q) {
    params.set("q", input.q);
  }
  if (input.status && input.status !== "all") {
    params.set("status", input.status);
  }
  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }
  if (input.currency) {
    params.set("currency", input.currency);
  }
  if (input.size && input.size !== adminPageSize) {
    params.set("size", String(input.size));
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function adminAccessStatus(input: { userId: string | null; appointed: boolean }): 401 | 403 | 200 {
  if (!input.userId) {
    return 401;
  }
  if (input.appointed !== true) {
    return 403;
  }
  return 200;
}
