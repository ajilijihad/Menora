import { emptyOpeningHours, type BusinessFormValues } from "@/lib/businesses/schema";
import type { BusinessRecord } from "@/lib/businesses/record";

export function blankBusinessForm(): BusinessFormValues {
  return {
    name: "",
    slug: "",
    businessType: "restaurant",
    description: "",
    phone: "",
    address: "",
    mapUrl: "",
    defaultLanguage: "en",
    timeZone: "UTC",
    hours: emptyOpeningHours(),
    social: {
      instagram: "",
      facebook: "",
      tiktok: "",
      x: "",
      website: "",
    },
  };
}

export function formValuesFromBusiness(business: BusinessRecord): BusinessFormValues {
  return {
    name: business.name,
    slug: business.slug,
    businessType: business.businessType,
    description: business.description ?? "",
    phone: business.phone ?? "",
    address: business.address ?? "",
    mapUrl: business.mapUrl ?? "",
    defaultLanguage: business.defaultLanguage,
    timeZone: business.timeZone,
    hours: business.openingHours,
    social: {
      instagram: business.socialLinks.instagram ?? "",
      facebook: business.socialLinks.facebook ?? "",
      tiktok: business.socialLinks.tiktok ?? "",
      x: business.socialLinks.x ?? "",
      website: business.socialLinks.website ?? "",
    },
  };
}
