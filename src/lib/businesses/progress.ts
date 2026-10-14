import type { OpeningHours, SocialLinks } from "./schema";
import { weekDays } from "./schema";

export const setupStepIds = [
  "description",
  "phone",
  "address",
  "map",
  "hours",
  "logo",
  "cover",
  "social",
] as const;

export type SetupStepId = (typeof setupStepIds)[number];

export type SetupSnapshot = {
  description: string | null;
  phone: string | null;
  address: string | null;
  mapUrl: string | null;
  openingHours: OpeningHours;
  socialLinks: SocialLinks;
  logoPath: string | null;
  coverPath: string | null;
};

export function hoursAreSet(hours: OpeningHours): boolean {
  return weekDays.some((day) => {
    const value = hours[day];
    return !value.closed && value.opens < value.closes;
  });
}

export function setupProgress(business: SetupSnapshot): { id: SetupStepId; done: boolean }[] {
  return [
    { id: "description", done: Boolean(business.description) },
    { id: "phone", done: Boolean(business.phone) },
    { id: "address", done: Boolean(business.address) },
    { id: "map", done: Boolean(business.mapUrl) },
    { id: "hours", done: hoursAreSet(business.openingHours) },
    { id: "logo", done: Boolean(business.logoPath) },
    { id: "cover", done: Boolean(business.coverPath) },
    { id: "social", done: Object.keys(business.socialLinks).length > 0 },
  ];
}

export function setupPercent(steps: { done: boolean }[]): number {
  if (steps.length === 0) {
    return 0;
  }

  const done = steps.filter((step) => step.done).length;
  return Math.round((done / steps.length) * 100);
}
