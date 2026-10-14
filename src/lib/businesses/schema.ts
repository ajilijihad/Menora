import { z } from "zod";

import { isPublicSlug, slugifyName } from "./slug";

export const businessTypes = ["restaurant", "cafe", "bakery", "other"] as const;
export type BusinessType = (typeof businessTypes)[number];

export const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type WeekDay = (typeof weekDays)[number];

export const socialNetworks = ["instagram", "facebook", "tiktok", "x", "website"] as const;
export type SocialNetwork = (typeof socialNetworks)[number];

export const timeZones = [
  "UTC",
  "Africa/Cairo",
  "Asia/Amman",
  "Asia/Baghdad",
  "Asia/Beirut",
  "Asia/Dubai",
  "Asia/Jerusalem",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Riyadh",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
] as const;

export type DayHours = {
  closed: boolean;
  opens: string;
  closes: string;
};

export type OpeningHours = Record<WeekDay, DayHours>;
export type SocialLinks = Partial<Record<SocialNetwork, string>>;

export const businessMessageCodes = [
  "name_required",
  "name_too_long",
  "slug_invalid",
  "slug_taken",
  "type_invalid",
  "description_too_long",
  "phone_invalid",
  "address_too_long",
  "map_invalid",
  "hours_invalid",
  "social_invalid",
  "language_invalid",
  "timezone_invalid",
  "forbidden",
  "not_found",
  "rate_limited",
  "unconfigured",
  "save_failed",
  "saved",
  "created",
  "deleted",
  "confirm_mismatch",
  "image_type",
  "image_too_large",
  "image_failed",
  "plan_limit",
] as const;

export type BusinessMessageCode = (typeof businessMessageCodes)[number];
export type BusinessField =
  | "name"
  | "slug"
  | "businessType"
  | "description"
  | "phone"
  | "address"
  | "mapUrl"
  | "hours"
  | "social"
  | "defaultLanguage"
  | "timeZone"
  | "confirmSlug";

export type BusinessFieldErrors = Partial<Record<BusinessField, BusinessMessageCode>>;

export type BusinessInput = {
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
  timeZone: (typeof timeZones)[number];
};

export type BusinessParseResult =
  | { ok: true; data: BusinessInput }
  | { ok: false; fieldErrors: BusinessFieldErrors };

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const phonePattern = /^\+?[0-9][0-9 ()-]{6,31}$/;

export function emptyOpeningHours(): OpeningHours {
  return {
    monday: { closed: true, opens: "09:00", closes: "17:00" },
    tuesday: { closed: true, opens: "09:00", closes: "17:00" },
    wednesday: { closed: true, opens: "09:00", closes: "17:00" },
    thursday: { closed: true, opens: "09:00", closes: "17:00" },
    friday: { closed: true, opens: "09:00", closes: "17:00" },
    saturday: { closed: true, opens: "09:00", closes: "17:00" },
    sunday: { closed: true, opens: "09:00", closes: "17:00" },
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const trimmed = text(value);
  return trimmed.length === 0 ? null : trimmed;
}

function httpsUrl(value: string, minLength: number): boolean {
  if (value.length < minLength || value.length > 500 || !value.startsWith("https://")) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const httpsLink = (minLength: number) =>
  z.string().refine((value) => httpsUrl(value, minLength));

const dayHoursSchema = z
  .object({
    closed: z.boolean(),
    opens: z.string().regex(timePattern),
    closes: z.string().regex(timePattern),
  })
  .refine((day) => day.closed || day.opens < day.closes);

export const descriptionLimit = 2000;

const businessProfileSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().refine(isPublicSlug),
  businessType: z.enum(businessTypes),
  description: z.string().max(descriptionLimit).nullable(),
  phone: z.string().regex(phonePattern).nullable(),
  address: z.string().min(1).max(300).nullable(),
  mapUrl: httpsLink(12).nullable(),
  openingHours: z.object({
    monday: dayHoursSchema,
    tuesday: dayHoursSchema,
    wednesday: dayHoursSchema,
    thursday: dayHoursSchema,
    friday: dayHoursSchema,
    saturday: dayHoursSchema,
    sunday: dayHoursSchema,
  }),
  socialLinks: z.object({
    instagram: httpsLink(8).optional(),
    facebook: httpsLink(8).optional(),
    tiktok: httpsLink(8).optional(),
    x: httpsLink(8).optional(),
    website: httpsLink(8).optional(),
  }),
  defaultLanguage: z.enum(["en", "ar"]),
  timeZone: z.enum(timeZones),
});

function storedHours(hours: OpeningHours): Record<string, { closed: boolean; opens?: string; closes?: string }> {
  const stored: Record<string, { closed: boolean; opens?: string; closes?: string }> = {};

  for (const day of weekDays) {
    const value = hours[day];
    if (value.closed) {
      continue;
    }

    stored[day] = { closed: false, opens: value.opens, closes: value.closes };
  }

  return stored;
}

export function parseOpeningHours(value: unknown): OpeningHours {
  const hours = emptyOpeningHours();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return hours;
  }

  const record = value as Record<string, unknown>;
  for (const day of weekDays) {
    const entry = record[day];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    const dayRecord = entry as Record<string, unknown>;
    const opens = typeof dayRecord.opens === "string" ? dayRecord.opens : hours[day].opens;
    const closes = typeof dayRecord.closes === "string" ? dayRecord.closes : hours[day].closes;
    if (!timePattern.test(opens) || !timePattern.test(closes)) {
      continue;
    }

    hours[day] = {
      closed: dayRecord.closed === true,
      opens,
      closes,
    };
  }

  return hours;
}

export function parseSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const links: SocialLinks = {};
  const record = value as Record<string, unknown>;
  for (const network of socialNetworks) {
    const link = record[network];
    if (typeof link === "string" && httpsUrl(link, 8)) {
      links[network] = link;
    }
  }

  return links;
}

export type BusinessFormValues = {
  name: string;
  slug: string;
  businessType: string;
  description: string;
  phone: string;
  address: string;
  mapUrl: string;
  defaultLanguage: string;
  timeZone: string;
  hours: OpeningHours;
  social: Record<SocialNetwork, string>;
};

function displayHours(source: Record<string, unknown>): OpeningHours {
  const hours = emptyOpeningHours();

  for (const day of weekDays) {
    hours[day] = {
      closed: source[`${day}Closed`] === "on" || source[`${day}Closed`] === "true",
      opens: text(source[`${day}Opens`]) || hours[day].opens,
      closes: text(source[`${day}Closes`]) || hours[day].closes,
    };
  }

  return hours;
}

export function readBusinessFormValues(source: Record<string, unknown>): BusinessFormValues {
  const hours = displayHours(source);
  const social = {
    instagram: text(source.instagram),
    facebook: text(source.facebook),
    tiktok: text(source.tiktok),
    x: text(source.x),
    website: text(source.website),
  };

  return {
    name: text(source.name),
    slug: text(source.slug),
    businessType: text(source.businessType),
    description: text(source.description),
    phone: text(source.phone),
    address: text(source.address),
    mapUrl: text(source.mapUrl),
    defaultLanguage: text(source.defaultLanguage) || "en",
    timeZone: text(source.timeZone) || "UTC",
    hours,
    social,
  };
}

const fieldByPath: Record<string, BusinessField> = {
  name: "name",
  slug: "slug",
  businessType: "businessType",
  description: "description",
  phone: "phone",
  address: "address",
  mapUrl: "mapUrl",
  openingHours: "hours",
  socialLinks: "social",
  defaultLanguage: "defaultLanguage",
  timeZone: "timeZone",
};

function fieldMessage(field: BusinessField, name: string, address: string | null): BusinessMessageCode {
  if (field === "name") {
    return name.length > 120 ? "name_too_long" : "name_required";
  }

  if (field === "slug") return "slug_invalid";
  if (field === "businessType") return "type_invalid";
  if (field === "description") return "description_too_long";
  if (field === "phone") return "phone_invalid";
  if (field === "address") return address && address.length > 300 ? "address_too_long" : "address_too_long";
  if (field === "mapUrl") return "map_invalid";
  if (field === "hours") return "hours_invalid";
  if (field === "social") return "social_invalid";
  if (field === "defaultLanguage") return "language_invalid";
  return "timezone_invalid";
}

export function parseBusinessForm(source: Record<string, unknown>): BusinessParseResult {
  const name = text(source.name);
  const requestedSlug = text(source.slug);
  const slug = requestedSlug || slugifyName(name) || "business";
  const description = optionalText(source.description);
  const phone = optionalText(source.phone);
  const address = optionalText(source.address);
  const mapUrl = optionalText(source.mapUrl);
  const socialLinks: SocialLinks = {};

  for (const network of socialNetworks) {
    const link = optionalText(source[network]);
    if (link) {
      socialLinks[network] = link;
    }
  }

  const candidate = {
    name,
    slug,
    businessType: text(source.businessType),
    description,
    phone,
    address,
    mapUrl,
    openingHours: displayHours(source),
    socialLinks,
    defaultLanguage: text(source.defaultLanguage) || "en",
    timeZone: text(source.timeZone) || "UTC",
  };

  const parsed = businessProfileSchema.safeParse(candidate);
  if (!parsed.success) {
    const fieldErrors: BusinessFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = fieldByPath[String(issue.path[0])];
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = fieldMessage(field, name, address);
      }
    }

    if (Object.keys(fieldErrors).length === 0) {
      fieldErrors.name = "name_required";
    }

    return { ok: false, fieldErrors };
  }

  return { ok: true, data: parsed.data };
}

export function openingHoursForStorage(hours: OpeningHours) {
  return storedHours(hours);
}

export function messageFromBusinessQuery(
  value: string | string[] | undefined,
): BusinessMessageCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return businessMessageCodes.find((code) => code === raw) ?? null;
}
