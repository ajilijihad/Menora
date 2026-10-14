export type BusinessRole = "owner" | "manager" | "editor";

export function canEditBusiness(role: BusinessRole | null): boolean {
  return role === "owner" || role === "manager";
}

export function canDeleteBusiness(role: BusinessRole | null): boolean {
  return role === "owner";
}

export function canEditMenu(role: BusinessRole | null): boolean {
  return role === "owner" || role === "manager" || role === "editor";
}

export function isBusinessRole(value: string | null | undefined): value is BusinessRole {
  return value === "owner" || value === "manager" || value === "editor";
}
