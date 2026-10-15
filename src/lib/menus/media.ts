export const menuImageLimit = 8;
export const maxMenuImageEdge = 1600;

const pathPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/img-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

const categoryPathPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/cat-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export function buildMenuImagePath(
  businessId: string,
  productId: string,
  extension: "jpg" | "png" | "webp",
  fileId: string,
): string {
  return `${businessId}/${productId}/img-${fileId}.${extension}`;
}

export function isSafeMenuImagePath(
  businessId: string,
  productId: string,
  path: string,
): boolean {
  const normalized = path.toLowerCase();
  return (
    pathPattern.test(normalized) &&
    !normalized.includes("..") &&
    normalized.startsWith(`${businessId.toLowerCase()}/${productId.toLowerCase()}/`)
  );
}

export function buildCategoryImagePath(
  businessId: string,
  categoryId: string,
  extension: "jpg" | "png" | "webp",
  fileId: string,
): string {
  return `${businessId}/cat-${categoryId}-${fileId}.${extension}`;
}

export function isSafeCategoryImagePath(businessId: string, categoryId: string, path: string): boolean {
  const normalized = path.toLowerCase();
  return (
    categoryPathPattern.test(normalized) &&
    !normalized.includes("..") &&
    normalized.startsWith(`${businessId.toLowerCase()}/cat-${categoryId.toLowerCase()}-`)
  );
}

export function menuImageUrl(supabaseUrl: string, path: string | null): string | null {
  if (!path || path.includes("..")) {
    return null;
  }
  const normalized = path.toLowerCase();
  if (!pathPattern.test(normalized) && !categoryPathPattern.test(normalized)) {
    return null;
  }

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/menu-media/${path}`;
}
