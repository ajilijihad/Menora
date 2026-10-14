import type { Locale } from "@/lib/i18n/locales";

export type HomepageEditorCopy = {
  title: string;
  description: string;
  viewLive: string;
  save: string;
  saving: string;
  saved: string;
  unsaved: string;
  preview: string;
  edit: string;
  desktop: string;
  mobile: string;
  english: string;
  arabic: string;
  enabled: string;
  add: string;
  remove: string;
  cancel: string;
  confirmRemove: string;
  moveUp: string;
  moveDown: string;
  empty: string;
  invalidStored: string;
  heroImage: string;
  changeImage: string;
  removeImage: string;
  imageHint: string;
  alt: string;
  sections: Record<"website" | "hero" | "features" | "how" | "examples" | "pricing" | "testimonials" | "faq" | "cta" | "footer" | "seo", string>;
  fields: Record<string, string>;
  messages: Record<"forbidden" | "invalid" | "failed" | "unconfigured" | "image_type" | "image_too_large", string>;
  testimonialsEmpty: string;
  priceNote: string;
  planHidden: string;
  contact: string;
  socials: string;
  websiteInfo: string;
  websiteInfoHint: string;
  logoTitle: string;
  logoHint: string;
  changeLogo: string;
  contactTitle: string;
  contactHint: string;
  socialHint: string;
  networks: Record<"instagram" | "facebook" | "tiktok" | "x" | "linkedin" | "youtube", string>;
  footerLinks: {
    title: string;
    hint: string;
    autoTitle: string;
    autoHint: string;
    addLink: string;
    addSection: string;
    addSectionHint: string;
    addExternal: string;
    addExternalHint: string;
    show: string;
    labelEn: string;
    labelAr: string;
    linkType: string;
    destination: string;
    preview: string;
    actions: string;
    pageSection: string;
    externalUrl: string;
    sectionFound: string;
    sectionMissing: string;
    externalOk: string;
    externalInvalid: string;
    availableTitle: string;
    availableHint: string;
    copyLink: string;
    copied: string;
    contactSection: string;
    descriptionEn: string;
    descriptionAr: string;
  };
};

const english: HomepageEditorCopy = {
  title: "Home page editor",
  description: "Manage your public landing page content and appearance.",
  viewLive: "View live site",
  save: "Save changes",
  saving: "Saving…",
  saved: "The homepage was saved.",
  unsaved: "Unsaved changes",
  preview: "Preview",
  edit: "Edit",
  desktop: "Desktop",
  mobile: "Mobile",
  english: "English",
  arabic: "العربية",
  enabled: "Visible on the site",
  add: "Add",
  remove: "Remove",
  cancel: "Cancel",
  confirmRemove: "Remove this entry?",
  moveUp: "Move up",
  moveDown: "Move down",
  empty: "Nothing is published in this section yet.",
  invalidStored: "The saved homepage could not be read. You are editing the default content, and saving will replace the stored document.",
  heroImage: "Hero image",
  changeImage: "Change image",
  removeImage: "Remove image",
  imageHint: "JPG, PNG, or WebP. Maximum 1.5 MB.",
  alt: "Alt text",
  sections: {
    website: "Website",
    hero: "Hero section",
    features: "Features",
    how: "How it works",
    examples: "Menu examples",
    pricing: "Pricing",
    testimonials: "Testimonials",
    faq: "FAQ",
    cta: "Bottom section",
    footer: "Footer",
    seo: "SEO & Meta",
  },
  fields: {
    badge: "Badge / subtitle",
    title: "Main title",
    description: "Description",
    primary: "Primary button text",
    secondary: "Secondary button text",
    secondaryHref: "Secondary button link",
    eyebrow: "Section label",
    icon: "Icon",
    theme: "Menu picture",
    question: "Question",
    answer: "Answer",
    name: "Name",
    role: "Role",
    quote: "Quote",
    label: "Label",
    href: "Link",
    badgePlan: "Badge",
    blurb: "Short description",
    feature: "Feature label",
    cta: "Button text",
    email: "Contact email",
    phone: "Phone number",
    address: "Address",
    siteName: "Website name",
    siteNameEn: "Website name (English)",
    siteNameAr: "اسم الموقع (العربية)",
    logo: "Logo",
    location: "Location",
    locationEn: "Location (English)",
    locationAr: "الموقع (العربية)",
    support: "Support URL",
    seoTitle: "Homepage title",
    seoDescription: "Meta description",
    ogTitle: "Open Graph title",
    ogDescription: "Open Graph description",
    index: "Allow search engines to index this page",
    body: "Description",
  },
  messages: {
    forbidden: "You do not have access to change the homepage.",
    invalid: "Check the fields and try again.",
    failed: "The homepage could not be saved.",
    unconfigured: "Homepage storage is not ready. Apply the latest database migration.",
    image_type: "Use a JPG, PNG, or WebP image.",
    image_too_large: "That image is larger than 1.5 MB.",
  },
  testimonialsEmpty: "No testimonials are stored. Add one only when you have a real quote and permission to publish the person’s name.",
  priceNote: "Prices, currencies, and plan limits stay on the plan record. This editor only changes how a plan is presented.",
  planHidden: "Hidden",
  contact: "Contact",
  socials: "Social links",
  websiteInfo: "Website information",
  websiteInfoHint: "Basic information about your website and contact details.",
  logoTitle: "Logo",
  logoHint: "Upload your website logo. It will appear in the header and footer.",
  changeLogo: "Change logo",
  contactTitle: "Contact information",
  contactHint: "This information will appear on your public website.",
  socialHint: "Add your social media links. Only enabled links will appear on your website.",
  networks: {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    x: "X (Twitter)",
    linkedin: "LinkedIn",
    youtube: "YouTube",
  },
  footerLinks: {
    title: "Footer navigation",
    hint: "Manage the links that appear in your website footer. You can link to page sections or external websites.",
    autoTitle: "Internal section links are generated automatically",
    autoHint: "Select a page section from the list and the correct link (e.g. #features) will be created for you.",
    addLink: "Add link",
    addSection: "Link to page section",
    addSectionHint: "Link to a section on this page (e.g. Features)",
    addExternal: "Link to external website",
    addExternalHint: "Link to any external URL (e.g. https://...)",
    show: "Show",
    labelEn: "Label (English)",
    labelAr: "Label (Arabic)",
    linkType: "Link type",
    destination: "Destination",
    preview: "Preview / Status",
    actions: "Actions",
    pageSection: "Page section",
    externalUrl: "External URL",
    sectionFound: "Section found",
    sectionMissing: "Section not found",
    externalOk: "External link",
    externalInvalid: "Enter a valid URL",
    availableTitle: "Available page sections",
    availableHint: "These are the sections you can link to from the footer. If a section is hidden, its link will not work.",
    copyLink: "Copy link",
    copied: "Copied",
    contactSection: "Contact section",
    descriptionEn: "Description (English)",
    descriptionAr: "Description (Arabic)",
  },
};

const arabic: HomepageEditorCopy = {
  title: "محرر الصفحة الرئيسية",
  description: "أدِر محتوى الصفحة العامة ومظهرها.",
  viewLive: "عرض الموقع",
  save: "حفظ التغييرات",
  saving: "جارٍ الحفظ…",
  saved: "تم حفظ الصفحة الرئيسية.",
  unsaved: "تغييرات غير محفوظة",
  preview: "معاينة",
  edit: "تحرير",
  desktop: "سطح المكتب",
  mobile: "الجوال",
  english: "English",
  arabic: "العربية",
  enabled: "ظاهرة في الموقع",
  add: "إضافة",
  remove: "حذف",
  cancel: "إلغاء",
  confirmRemove: "حذف هذا العنصر؟",
  moveUp: "تحريك للأعلى",
  moveDown: "تحريك للأسفل",
  empty: "لا يوجد محتوى منشور في هذا القسم بعد.",
  invalidStored: "تعذرت قراءة الصفحة المحفوظة. أنت تحرّر المحتوى الافتراضي، والحفظ سيستبدل المستند المخزّن.",
  heroImage: "صورة المقدمة",
  changeImage: "تغيير الصورة",
  removeImage: "حذف الصورة",
  imageHint: "JPG أو PNG أو WebP. الحد الأقصى 1.5 ميغابايت.",
  alt: "النص البديل",
  sections: {
    website: "الموقع",
    hero: "قسم البداية",
    features: "المزايا",
    how: "كيف يعمل",
    examples: "أمثلة القوائم",
    pricing: "الأسعار",
    testimonials: "الآراء",
    faq: "الأسئلة",
    cta: "القسم السفلي",
    footer: "التذييل",
    seo: "الظهور والبيانات",
  },
  fields: {
    badge: "الشارة",
    title: "العنوان",
    description: "الوصف",
    primary: "نص الزر الأساسي",
    secondary: "نص الزر الثانوي",
    secondaryHref: "رابط الزر الثانوي",
    eyebrow: "عنوان القسم الصغير",
    icon: "الأيقونة",
    theme: "صورة القائمة",
    question: "السؤال",
    answer: "الجواب",
    name: "الاسم",
    role: "الصفة",
    quote: "الاقتباس",
    label: "التسمية",
    href: "الرابط",
    badgePlan: "الشارة",
    blurb: "وصف قصير",
    feature: "ميزة",
    cta: "نص الزر",
    email: "بريد التواصل",
    phone: "رقم الهاتف",
    address: "العنوان",
    siteName: "اسم الموقع",
    siteNameEn: "اسم الموقع (الإنجليزية)",
    siteNameAr: "اسم الموقع (العربية)",
    logo: "الشعار",
    location: "الموقع",
    locationEn: "الموقع (الإنجليزية)",
    locationAr: "الموقع (العربية)",
    support: "رابط الدعم",
    seoTitle: "عنوان الصفحة",
    seoDescription: "وصف الميتا",
    ogTitle: "عنوان المشاركة",
    ogDescription: "وصف المشاركة",
    index: "السماح لمحركات البحث بفهرسة هذه الصفحة",
    body: "الوصف",
  },
  messages: {
    forbidden: "ليست لديك صلاحية تعديل الصفحة الرئيسية.",
    invalid: "راجع الحقول ثم أعد المحاولة.",
    failed: "تعذر حفظ الصفحة الرئيسية.",
    unconfigured: "تخزين الصفحة الرئيسية غير جاهز. طبّق آخر ترحيل لقاعدة البيانات.",
    image_type: "استخدم صورة JPG أو PNG أو WebP.",
    image_too_large: "الصورة أكبر من 1.5 ميغابايت.",
  },
  testimonialsEmpty: "لا توجد آراء محفوظة. أضف رأيًا فقط عندما يكون اقتباسًا حقيقيًا ولديك إذن بنشر اسم صاحبه.",
  priceNote: "تبقى الأسعار والعملات وحدود الخطة في سجل الخطة. هذا المحرر يغيّر طريقة العرض فقط.",
  planHidden: "مخفية",
  contact: "التواصل",
  socials: "روابط التواصل",
  websiteInfo: "معلومات الموقع",
  websiteInfoHint: "المعلومات الأساسية عن موقعك وبيانات التواصل.",
  logoTitle: "الشعار",
  logoHint: "ارفع شعار الموقع. سيظهر في الترويسة والتذييل.",
  changeLogo: "تغيير الشعار",
  contactTitle: "معلومات التواصل",
  contactHint: "ستظهر هذه المعلومات في الموقع العام.",
  socialHint: "أضف روابط التواصل. تظهر الروابط المفعّلة فقط في الموقع.",
  networks: {
    instagram: "إنستغرام",
    facebook: "فيسبوك",
    tiktok: "تيك توك",
    x: "إكس (تويتر)",
    linkedin: "لينكدإن",
    youtube: "يوتيوب",
  },
  footerLinks: {
    title: "روابط التذييل",
    hint: "أدر الروابط التي تظهر في تذييل الموقع. يمكنك الربط بأقسام الصفحة أو بمواقع خارجية.",
    autoTitle: "روابط الأقسام الداخلية تُنشأ تلقائيًا",
    autoHint: "اختر قسمًا من القائمة وسيتم إنشاء الرابط الصحيح (مثل #features) لك.",
    addLink: "إضافة رابط",
    addSection: "رابط إلى قسم في الصفحة",
    addSectionHint: "اربط بقسم في هذه الصفحة (مثل المزايا)",
    addExternal: "رابط إلى موقع خارجي",
    addExternalHint: "اربط بأي عنوان خارجي (مثل https://...)",
    show: "إظهار",
    labelEn: "التسمية (الإنجليزية)",
    labelAr: "التسمية (العربية)",
    linkType: "نوع الرابط",
    destination: "الوجهة",
    preview: "المعاينة / الحالة",
    actions: "إجراءات",
    pageSection: "قسم في الصفحة",
    externalUrl: "رابط خارجي",
    sectionFound: "القسم موجود",
    sectionMissing: "القسم غير موجود",
    externalOk: "رابط خارجي",
    externalInvalid: "أدخل رابطًا صالحًا",
    availableTitle: "أقسام الصفحة المتاحة",
    availableHint: "هذه الأقسام التي يمكنك الربط بها من التذييل. إذا كان القسم مخفيًا فلن يعمل رابطه.",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ",
    contactSection: "قسم التواصل",
    descriptionEn: "الوصف (الإنجليزية)",
    descriptionAr: "الوصف (العربية)",
  },
};

export function homepageEditorCopy(locale: Locale): HomepageEditorCopy {
  return locale === "ar" ? arabic : english;
}
