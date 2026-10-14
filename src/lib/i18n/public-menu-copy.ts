import type { SocialNetwork, WeekDay } from "@/lib/businesses/schema";
import type { DietaryLabel } from "@/lib/menus/schema";

export type PublicMenuCopy = {
  searchLabel: string;
  searchPlaceholder: string;
  categories: string;
  featured: string;
  soldOut: string;
  variants: string;
  addons: string;
  contact: string;
  hours: string;
  closed: string;
  address: string;
  phone: string;
  map: string;
  emptyTitle: string;
  emptyDescription: string;
  noMatches: string;
  resultCount: string;
  notFoundTitle: string;
  notFoundDescription: string;
  unavailableTitle: string;
  unavailableDescription: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  switchLanguage: string;
  skipToMenu: string;
  viewAll: string;
  openMenu: string;
  closeMenu: string;
  was: string;
  backHome: string;
  days: Record<WeekDay, string>;
  socials: Record<SocialNetwork, string>;
  labels: Record<DietaryLabel, string>;
};

const days = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
} as const;

const daysAr = {
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
  sunday: "الأحد",
} as const;

const socials = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  website: "Website",
} as const;

const socialsAr = {
  instagram: "إنستغرام",
  facebook: "فيسبوك",
  tiktok: "تيك توك",
  x: "إكس",
  website: "الموقع",
} as const;

const labels = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  spicy: "Spicy",
  gluten: "Gluten",
  dairy: "Dairy",
  nuts: "Nuts",
  shellfish: "Shellfish",
  sesame: "Sesame",
} as const;

const labelsAr = {
  vegetarian: "نباتي",
  vegan: "نباتي صرف",
  spicy: "حار",
  gluten: "جلوتين",
  dairy: "ألبان",
  nuts: "مكسرات",
  shellfish: "محار",
  sesame: "سمسم",
} as const;

export const publicMenuCopyEn: PublicMenuCopy = {
  searchLabel: "Search this menu",
  searchPlaceholder: "Search dishes",
  categories: "Categories",
  featured: "Featured",
  soldOut: "Sold out",
  variants: "Sizes",
  addons: "Add-ons",
  contact: "Visit",
  hours: "Hours",
  closed: "Closed",
  address: "Address",
  phone: "Phone",
  map: "Map",
  emptyTitle: "This menu is being prepared",
  emptyDescription: "Published dishes will appear here.",
  noMatches: "Nothing on the menu matches that search.",
  resultCount: "Matching dishes",
  notFoundTitle: "Menu not available",
  notFoundDescription: "This address does not have a published menu.",
  unavailableTitle: "Menu temporarily unavailable",
  unavailableDescription: "This menu cannot be loaded in this environment yet.",
  errorTitle: "The menu could not be loaded",
  errorDescription: "Something went wrong while opening this menu. Try again.",
  retry: "Try again",
  switchLanguage: "العربية",
  skipToMenu: "Skip to menu",
  viewAll: "View all",
  openMenu: "Open menu details",
  closeMenu: "Close menu details",
  was: "Was",
  backHome: "Back to home",
  days,
  socials,
  labels,
};

export const publicMenuCopyAr: PublicMenuCopy = {
  searchLabel: "البحث في هذه القائمة",
  searchPlaceholder: "ابحث عن طبق",
  categories: "التصنيفات",
  featured: "المميز",
  soldOut: "نفد",
  variants: "الأحجام",
  addons: "الإضافات",
  contact: "الزيارة",
  hours: "الساعات",
  closed: "مغلق",
  address: "العنوان",
  phone: "الهاتف",
  map: "الخريطة",
  emptyTitle: "هذه القائمة قيد التجهيز",
  emptyDescription: "ستظهر الأطباق المنشورة هنا.",
  noMatches: "لا يوجد في القائمة ما يطابق هذا البحث.",
  resultCount: "الأطباق المطابقة",
  notFoundTitle: "القائمة غير متاحة",
  notFoundDescription: "هذا العنوان لا يملك قائمة منشورة.",
  unavailableTitle: "القائمة غير متاحة مؤقتًا",
  unavailableDescription: "لا يمكن تحميل هذه القائمة في هذه البيئة بعد.",
  errorTitle: "تعذر تحميل القائمة",
  errorDescription: "حدث خطأ أثناء فتح هذه القائمة. حاول مرة أخرى.",
  retry: "حاول مرة أخرى",
  switchLanguage: "English",
  skipToMenu: "تخطي إلى القائمة",
  viewAll: "عرض الكل",
  openMenu: "فتح تفاصيل المنيو",
  closeMenu: "إغلاق تفاصيل المنيو",
  was: "كان",
  backHome: "العودة إلى الرئيسية",
  days: daysAr,
  socials: socialsAr,
  labels: labelsAr,
};
