import { defaultAppearance, type MenuAppearance } from "@/lib/menus/appearance";

export const overviewStepIds = ["info", "categories", "products", "design", "publish"] as const;

export type OverviewStepId = (typeof overviewStepIds)[number];

export function overviewChecklist(input: {
  hasInfo: boolean;
  categoryCount: number;
  productCount: number;
  designSaved: boolean;
  published: boolean;
}): { id: OverviewStepId; done: boolean }[] {
  return [
    { id: "info", done: input.hasInfo },
    { id: "categories", done: input.categoryCount > 0 },
    { id: "products", done: input.productCount > 0 },
    { id: "design", done: input.designSaved },
    { id: "publish", done: input.published },
  ];
}

export function overviewPercent(steps: { done: boolean }[]): number {
  if (steps.length === 0) {
    return 0;
  }

  return Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
}

export function appearanceMatchesDefault(appearance: MenuAppearance): boolean {
  const defaults = defaultAppearance(appearance.theme);
  return (Object.keys(defaults) as (keyof MenuAppearance)[]).every((key) => appearance[key] === defaults[key]);
}

export function viewTrend(days: { menu: number }[]): number | null {
  if (days.length < 2) {
    return null;
  }

  const midpoint = Math.floor(days.length / 2);
  const previous = days.slice(0, midpoint).reduce((sum, day) => sum + day.menu, 0);
  const recent = days.slice(midpoint).reduce((sum, day) => sum + day.menu, 0);
  if (previous <= 0) {
    return null;
  }

  return Math.round(((recent - previous) / previous) * 100);
}

export function daysRemaining(periodEnd: string | null, now = new Date()): number | null {
  if (!periodEnd) {
    return null;
  }

  const time = Date.parse(periodEnd);
  if (!Number.isFinite(time)) {
    return null;
  }

  return Math.max(0, Math.ceil((time - now.getTime()) / 86_400_000));
}
