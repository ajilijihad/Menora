const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isPublicSlug(value: string): boolean {
  return value.length >= 1 && value.length <= 60 && slugPattern.test(value);
}

export function slugifyName(name: string): string {
  const ascii = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48)
    .replace(/-+$/g, "");

  return isPublicSlug(ascii) ? ascii : "";
}

export function uniqueSlug(base: string, isTaken: (slug: string) => boolean): string {
  const root = isPublicSlug(base) ? base : "business";
  if (!isTaken(root)) {
    return root;
  }

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${root}-${suffix}`.slice(0, 60).replace(/-+$/g, "");
    if (isPublicSlug(candidate) && !isTaken(candidate)) {
      return candidate;
    }
  }

  return `${root.slice(0, 40)}-x${suffixToken()}`;
}

function suffixToken(): string {
  return Math.random().toString(36).slice(2, 8);
}
