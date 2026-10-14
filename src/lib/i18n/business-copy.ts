import type { BusinessMessageCode, BusinessType, SocialNetwork, WeekDay } from "@/lib/businesses/schema";
import type { SetupStepId } from "@/lib/businesses/progress";

export type BusinessCopy = {
  createTitle: string;
  createDescription: string;
  settingsTitle: string;
  settingsDescription: string;
  overviewDescription: string;
  deleteTitle: string;
  deleteDescription: string;
  readOnly: string;
  selectorLabel: string;
  addBusiness: string;
  openBusiness: string;
  settingsLink: string;
  deleteLink: string;
  backToBusinesses: string;
  publicSlug: string;
  setupTitle: string;
  setupOf: string;
  onboardingTitle: string;
  onboardingDescription: string;
  onboarding: [string, string, string];
  emptyContact: string;
  emptyDescription: string;
  emptyHours: string;
  emptyPhotos: string;
  fields: {
    name: string;
    slug: string;
    slugHint: string;
    type: string;
    description: string;
    phone: string;
    address: string;
    mapUrl: string;
    language: string;
    timeZone: string;
    logo: string;
    cover: string;
    confirmSlug: string;
    confirmHint: string;
  };
  types: Record<BusinessType, string>;
  days: Record<WeekDay, string>;
  closed: string;
  opens: string;
  closes: string;
  hoursTitle: string;
  hoursHint: string;
  copyHours: string;
  open: string;
  infoTitle: string;
  infoHint: string;
  socialTitle: string;
  socialHint: string;
  mediaTitle: string;
  mediaHint: string;
  changeLogo: string;
  changeCover: string;
  localizationTitle: string;
  localizationHint: string;
  advancedTitle: string;
  advancedHint: string;
  copied: string;
  copyUrl: string;
  slugRule: string;
  tabs: {
    info: string;
    hours: string;
    social: string;
    media: string;
    localization: string;
    advanced: string;
  };
  social: Record<SocialNetwork, string>;
  languages: { en: string; ar: string };
  submitCreate: string;
  submitSave: string;
  submitDelete: string;
  pending: string;
  cancel: string;
  removeImage: string;
  imageHint: string;
  steps: Record<SetupStepId, string>;
  messages: Record<BusinessMessageCode, string>;
};

export const businessCopyEn: BusinessCopy = {
  createTitle: "Create a business",
  createDescription: "Add the business details, hours, photos, and contact links.",
  settingsTitle: "Settings",
  settingsDescription: "Manage your business information, opening hours, social links, and more.",
  overviewDescription: "This business is a draft until you publish a menu later.",
  deleteTitle: "Delete this business",
  deleteDescription: "This removes the business, its membership, and its logo and cover. Type the public slug to confirm.",
  readOnly: "You can view this business. Owners and managers can edit it.",
  selectorLabel: "Business",
  addBusiness: "Add a business",
  openBusiness: "Open",
  settingsLink: "Edit details",
  deleteLink: "Delete business",
  backToBusinesses: "All businesses",
  publicSlug: "Public slug",
  setupTitle: "Setup progress",
  setupOf: "complete",
  onboardingTitle: "Set up your first business",
  onboardingDescription: "Create the business profile before you add a menu.",
  onboarding: [
    "Create the business and its public slug.",
    "Add a phone number, address, and opening hours.",
    "Upload a logo and a cover image.",
  ],
  emptyContact: "No phone number or address yet.",
  emptyDescription: "No description yet.",
  emptyHours: "Opening hours are still closed for every day.",
  emptyPhotos: "No logo or cover image yet.",
  fields: {
    name: "Business name",
    slug: "Public slug",
    slugHint: "Leave this blank to generate a unique address from the name. Use lowercase letters, numbers, and hyphens.",
    type: "Business type",
    description: "Description",
    phone: "Phone number",
    address: "Address",
    mapUrl: "Map link",
    language: "Default language",
    timeZone: "Time zone",
    logo: "Logo",
    cover: "Cover image",
    confirmSlug: "Type the public slug",
    confirmHint: "This must match the slug exactly.",
  },
  types: {
    restaurant: "Restaurant",
    cafe: "Cafe",
    bakery: "Bakery",
    other: "Other",
  },
  days: {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  },
  closed: "Closed",
  opens: "Opens",
  closes: "Closes",
  hoursTitle: "Opening hours",
  hoursHint: "Set your business hours for each day. You can mark days as closed.",
  copyHours: "Copy hours to all days",
  open: "Open",
  infoTitle: "Business information",
  infoHint: "Basic details about your business. This information appears on your public menu.",
  socialTitle: "Social links",
  socialHint: "Add your social media links to appear on your menu.",
  mediaTitle: "Media",
  mediaHint: "Upload your logo and cover image. These appear on your public menu.",
  changeLogo: "Change logo",
  changeCover: "Change cover",
  localizationTitle: "Localization",
  localizationHint: "Choose the default menu language and time zone.",
  advancedTitle: "Advanced",
  advancedHint: "Delete this business. This cannot be undone from the settings form.",
  copied: "Copied",
  copyUrl: "Copy link",
  slugRule: "Use lowercase letters, numbers, and hyphens only.",
  tabs: {
    info: "Business info",
    hours: "Opening hours",
    social: "Social links",
    media: "Media",
    localization: "Localization",
    advanced: "Advanced",
  },
  social: {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    x: "X (Twitter)",
    website: "Website",
  },
  languages: { en: "English", ar: "Arabic" },
  submitCreate: "Create business",
  submitSave: "Save changes",
  submitDelete: "Delete business",
  pending: "Please wait",
  cancel: "Cancel",
  removeImage: "Remove current image",
  imageHint: "JPG, PNG, or WebP. Maximum 1.5 MB.",
  steps: {
    description: "Description",
    phone: "Phone",
    address: "Address",
    map: "Map link",
    hours: "Opening hours",
    logo: "Logo",
    cover: "Cover image",
    social: "Social link",
  },
  messages: {
    name_required: "Enter the business name.",
    name_too_long: "Use a name of 120 characters or fewer.",
    slug_invalid: "Use lowercase letters, numbers, and single hyphens.",
    slug_taken: "That public slug is already in use.",
    type_invalid: "Choose a business type.",
    description_too_long: "Use a description of 2,000 characters or fewer.",
    phone_invalid: "Enter a phone number using digits, spaces, or a leading plus.",
    address_too_long: "Use an address of 300 characters or fewer.",
    map_invalid: "Enter an https map link.",
    hours_invalid: "Check the opening hours. An open day needs an opening time before the closing time.",
    social_invalid: "Enter social links as https addresses.",
    language_invalid: "Choose English or Arabic.",
    timezone_invalid: "Choose a time zone from the list.",
    forbidden: "You do not have permission to change this business.",
    not_found: "That business is not available on this account.",
    rate_limited: "Too many updates. Wait a few minutes and try again.",
    unconfigured: "Business storage is not configured in this environment yet.",
    save_failed: "We could not save those details. Try again.",
    saved: "Business details were saved.",
    created: "The business was created. You are its owner.",
    deleted: "The business was deleted.",
    confirm_mismatch: "Type the public slug exactly to confirm deletion.",
    image_type: "Upload a JPG, PNG, or WebP image.",
    image_too_large: "Use an image of 1.5 MB or smaller.",
    image_failed: "The details were saved, but the image could not be stored.",
    plan_limit: "This plan has reached its business limit. Choose a higher plan to add another.",
  },
};

export const businessCopyAr: BusinessCopy = {
  createTitle: "إنشاء عمل",
  createDescription: "أضف بيانات العمل والساعات والصور وروابط التواصل.",
  settingsTitle: "الإعدادات",
  settingsDescription: "أدِر معلومات العمل وساعات العمل وروابط التواصل والمزيد.",
  overviewDescription: "يبقى هذا العمل مسودة إلى أن تنشر قائمة لاحقًا.",
  deleteTitle: "حذف هذا العمل",
  deleteDescription: "يحذف هذا العمل وعضويته وشعاره وصورة الغلاف. اكتب المعرّف العام للتأكيد.",
  readOnly: "يمكنك عرض هذا العمل. المالكون والمديرون هم من يعدّلونه.",
  selectorLabel: "العمل",
  addBusiness: "إضافة عمل",
  openBusiness: "فتح",
  settingsLink: "تعديل البيانات",
  deleteLink: "حذف العمل",
  backToBusinesses: "كل الأعمال",
  publicSlug: "المعرّف العام",
  setupTitle: "تقدم الإعداد",
  setupOf: "مكتمل",
  onboardingTitle: "أعد عملك الأول",
  onboardingDescription: "أنشئ ملف العمل قبل إضافة قائمة.",
  onboarding: [
    "أنشئ العمل ومعرّفه العام.",
    "أضف رقم الهاتف والعنوان وساعات العمل.",
    "ارفع الشعار وصورة الغلاف.",
  ],
  emptyContact: "لا يوجد رقم هاتف أو عنوان بعد.",
  emptyDescription: "لا يوجد وصف بعد.",
  emptyHours: "ساعات العمل مغلقة في كل الأيام.",
  emptyPhotos: "لا يوجد شعار أو صورة غلاف بعد.",
  fields: {
    name: "اسم العمل",
    slug: "المعرّف العام",
    slugHint: "اتركه فارغًا لإنشاء عنوان فريد من الاسم. استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات.",
    type: "نوع العمل",
    description: "الوصف",
    phone: "رقم الهاتف",
    address: "العنوان",
    mapUrl: "رابط الخريطة",
    language: "اللغة الافتراضية",
    timeZone: "المنطقة الزمنية",
    logo: "الشعار",
    cover: "صورة الغلاف",
    confirmSlug: "اكتب المعرّف العام",
    confirmHint: "يجب أن يطابق المعرّف تمامًا.",
  },
  types: {
    restaurant: "مطعم",
    cafe: "مقهى",
    bakery: "مخبز",
    other: "أخرى",
  },
  days: {
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    sunday: "الأحد",
  },
  closed: "مغلق",
  opens: "يفتح",
  closes: "يغلق",
  hoursTitle: "ساعات العمل",
  hoursHint: "حدّد ساعات العمل لكل يوم. يمكنك تعليم الأيام كمغلقة.",
  copyHours: "نسخ الساعات إلى كل الأيام",
  open: "مفتوح",
  infoTitle: "معلومات العمل",
  infoHint: "التفاصيل الأساسية عن عملك. تظهر هذه المعلومات في قائمتك العامة.",
  socialTitle: "روابط التواصل",
  socialHint: "أضف روابط التواصل لتظهر في قائمتك.",
  mediaTitle: "الوسائط",
  mediaHint: "ارفع الشعار وصورة الغلاف. تظهران في قائمتك العامة.",
  changeLogo: "تغيير الشعار",
  changeCover: "تغيير الغلاف",
  localizationTitle: "اللغة والمنطقة",
  localizationHint: "اختر لغة القائمة الافتراضية والمنطقة الزمنية.",
  advancedTitle: "متقدم",
  advancedHint: "حذف هذا العمل. لا يمكن التراجع عن ذلك من نموذج الإعدادات.",
  copied: "تم النسخ",
  copyUrl: "نسخ الرابط",
  slugRule: "استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.",
  tabs: {
    info: "بيانات العمل",
    hours: "ساعات العمل",
    social: "روابط التواصل",
    media: "الوسائط",
    localization: "اللغة والمنطقة",
    advanced: "متقدم",
  },
  social: {
    instagram: "إنستغرام",
    facebook: "فيسبوك",
    tiktok: "تيك توك",
    x: "X (تويتر)",
    website: "الموقع",
  },
  languages: { en: "الإنجليزية", ar: "العربية" },
  submitCreate: "إنشاء العمل",
  submitSave: "حفظ التغييرات",
  submitDelete: "حذف العمل",
  pending: "يرجى الانتظار",
  cancel: "إلغاء",
  removeImage: "إزالة الصورة الحالية",
  imageHint: "JPG أو PNG أو WebP. الحد الأقصى 1.5 ميغابايت.",
  steps: {
    description: "الوصف",
    phone: "الهاتف",
    address: "العنوان",
    map: "رابط الخريطة",
    hours: "ساعات العمل",
    logo: "الشعار",
    cover: "صورة الغلاف",
    social: "رابط تواصل",
  },
  messages: {
    name_required: "أدخل اسم العمل.",
    name_too_long: "استخدم اسمًا من 120 حرفًا أو أقل.",
    slug_invalid: "استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات مفردة.",
    slug_taken: "هذا المعرّف العام مستخدم بالفعل.",
    type_invalid: "اختر نوع العمل.",
    description_too_long: "استخدم وصفًا من 2000 حرف أو أقل.",
    phone_invalid: "أدخل رقم هاتف من أرقام ومسافات أو علامة زائد في البداية.",
    address_too_long: "استخدم عنوانًا من 300 حرف أو أقل.",
    map_invalid: "أدخل رابط خريطة يبدأ بـ https.",
    hours_invalid: "راجع ساعات العمل. اليوم المفتوح يحتاج وقت فتح قبل وقت الإغلاق.",
    social_invalid: "أدخل روابط التواصل كعناوين https.",
    language_invalid: "اختر الإنجليزية أو العربية.",
    timezone_invalid: "اختر منطقة زمنية من القائمة.",
    forbidden: "ليست لديك صلاحية لتعديل هذا العمل.",
    not_found: "هذا العمل غير متاح في هذا الحساب.",
    rate_limited: "تحديثات كثيرة. انتظر بضع دقائق ثم أعد المحاولة.",
    unconfigured: "تخزين الأعمال غير مُعد في هذه البيئة بعد.",
    save_failed: "تعذر حفظ هذه البيانات. حاول مرة أخرى.",
    saved: "تم حفظ بيانات العمل.",
    created: "تم إنشاء العمل. أنت مالكه.",
    deleted: "تم حذف العمل.",
    confirm_mismatch: "اكتب المعرّف العام تمامًا لتأكيد الحذف.",
    image_type: "ارفع صورة JPG أو PNG أو WebP.",
    image_too_large: "استخدم صورة بحجم 1.5 ميغابايت أو أقل.",
    image_failed: "حُفظت البيانات، لكن تعذر تخزين الصورة.",
    plan_limit: "وصلت هذه الخطة إلى حد الأعمال. اختر خطة أعلى لإضافة عمل آخر.",
  },
};
