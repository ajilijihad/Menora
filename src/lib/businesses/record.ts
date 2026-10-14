import type { BusinessRole } from "./access";
import type { BusinessType, OpeningHours, SocialLinks } from "./schema";

export type BusinessRecord = {
  id: string;
  role: BusinessRole;
  name: string;
  slug: string;
  businessType: BusinessType;
  description: string | null;
  phone: string | null;
  address: string | null;
  mapUrl: string | null;
  openingHours: OpeningHours;
  socialLinks: SocialLinks;
  defaultLanguage: "en" | "ar";
  timeZone: string;
  logoPath: string | null;
  coverPath: string | null;
  status: "draft" | "active" | "archived";
  isPublished: boolean;
};
