export type InsightsCopy = {
  analytics: string;
  analyticsDescription: string;
  privacy: string;
  rangeInvalid: string;
  vsPrevious: string;
  days7: string;
  days30: string;
  days90: string;
  dailyTitle: string;
  exportCsv: string;
  productsEmptyTitle: string;
  productsEmptyBody: string;
  categoriesEmptyTitle: string;
  categoriesEmptyBody: string;
  breakdownEmpty: string;
  deviceNote: string;
  sourceNote: string;
  domain: string;
  domainDescription: string;
  from: string;
  to: string;
  apply: string;
  menuViews: string;
  productViews: string;
  byDay: string;
  byDevice: string;
  byReferrer: string;
  products: string;
  categories: string;
  empty: string;
  retention: string;
  day: string;
  views: string;
  previous: string;
  next: string;
  devices: Record<"mobile" | "tablet" | "desktop" | "unknown", string>;
  sources: Record<"direct" | "search" | "social" | "other", string>;
  hostname: string;
  connectTitle: string;
  connectDescription: string;
  hostnameHint: string;
  adding: string;
  checking: string;
  learnMore: string;
  statusTitle: string;
  noDomainTitle: string;
  notConfigured: string;
  viewPlans: string;
  premiumTitle: string;
  dnsTitle: string;
  dnsIntro: string;
  dnsEmpty: string;
  dnsWait: string;
  recordType: string;
  recordHost: string;
  recordValue: string;
  copyValue: string;
  copied: string;
  visit: string;
  verifiedAt: string;
  lastChecked: string;
  stepsTitle: string;
  steps: {
    add: string;
    addHint: string;
    dns: string;
    dnsHint: string;
    verify: string;
    verifyHint: string;
    serve: string;
    serveHint: string;
  };
  stepNeedsHost: string;
  sslHonest: string;
  helpTitle: string;
  helpItems: string[];
  domainId: string;
  submit: string;
  check: string;
  remove: string;
  confirmRemove: string;
  status: string;
  statuses: Record<"pending" | "verified" | "active" | "disabled", string>;
  locked: string;
  lockedDescription: string;
  none: string;
  txtName: string;
  txtValue: string;
  routingTitle: string;
  routingBody: string;
  certificateTitle: string;
  certificateBody: string;
  activationTitle: string;
  activationBody: string;
  verifiedNote: string;
  activeNote: string;
  notices: Record<string, string>;
};

export const insightsCopyEn: InsightsCopy = {
  analytics: "Analytics",
  analyticsDescription: "Track how people view your menu and discover your most popular items.",
  privacy: "Visitor addresses are not stored or shown.",
  rangeInvalid: "The start date must be on or before the end date, inside this plan’s analytics window.",
  vsPrevious: "vs previous {count} days",
  days7: "7 days",
  days30: "30 days",
  days90: "90 days",
  dailyTitle: "Daily statistics",
  exportCsv: "Export",
  productsEmptyTitle: "No product views yet",
  productsEmptyBody: "Products will appear here when visitors view them from your menu.",
  categoriesEmptyTitle: "No category views yet",
  categoriesEmptyBody: "Categories will appear here when visitors view products in them.",
  breakdownEmpty: "No menu views in this range.",
  deviceNote: "Counted from menu views.",
  sourceNote: "Counted from menu views. A visit with no referrer is Direct.",
  domain: "Custom domain",
  domainDescription: "Connect your own domain to give your restaurant menu a professional address.",
  from: "From",
  to: "To",
  apply: "Apply",
  menuViews: "Menu views",
  productViews: "Product views",
  byDay: "Views by day",
  byDevice: "Device breakdown",
  byReferrer: "Traffic source",
  products: "Most viewed products",
  categories: "Popular categories",
  empty: "No views in this range.",
  retention: "This plan includes views from",
  day: "Day",
  views: "Views",
  previous: "Previous",
  next: "Next",
  devices: { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop", unknown: "Unknown" },
  sources: { direct: "Direct", search: "Search", social: "Social", other: "Other sites" },
  hostname: "Hostname",
  connectTitle: "Connect your domain",
  connectDescription: "Enter a hostname you own. Menor will check the required DNS records before it can be verified.",
  hostnameHint: "Use a hostname such as menu.example.com. A full web address is not accepted.",
  adding: "Adding",
  checking: "Checking",
  learnMore: "Learn more about custom domains",
  statusTitle: "Domain status",
  noDomainTitle: "No domain connected",
  notConfigured: "Not configured",
  viewPlans: "View plans",
  premiumTitle: "Custom domains are a premium feature",
  dnsTitle: "DNS configuration",
  dnsIntro: "Open your DNS provider, add the record shown here, and allow time for DNS to propagate.",
  dnsEmpty: "Add a domain to see the TXT record Menor can verify. Menor does not have a routing target to display.",
  dnsWait: "Add the TXT record, then choose Check DNS. A saved hostname is not verified yet.",
  recordType: "Type",
  recordHost: "Name / Host",
  recordValue: "Value",
  copyValue: "Copy",
  copied: "Copied",
  visit: "Visit domain",
  verifiedAt: "Verified",
  lastChecked: "Last check",
  stepsTitle: "Setup",
  steps: {
    add: "Add domain",
    addHint: "Enter your hostname",
    dns: "Configure DNS",
    dnsHint: "Add the TXT record",
    verify: "Verify connection",
    verifyHint: "Menor checks the TXT record",
    serve: "Activation",
    serveHint: "Requires hosting setup",
  },
  stepNeedsHost: "Needs hosting setup",
  sslHonest: "Menor does not confirm that a certificate has been issued. The host does that after it accepts the hostname.",
  helpTitle: "Need help connecting your domain?",
  helpItems: [
    "Enter the hostname only, such as menu.example.com.",
    "The TXT name and value must match the record shown here.",
    "DNS changes can take time to propagate.",
    "Attach the hostname in your hosting provider as well. Menor cannot do that from this page.",
    "A certificate is issued by the host. This page does not mark SSL as ready.",
  ],
  domainId: "Domain id",
  submit: "Add domain",
  check: "Verify DNS",
  remove: "Remove domain",
  confirmRemove: "I want to remove this domain",
  status: "Status",
  statuses: {
    pending: "Pending verification",
    verified: "Verified",
    active: "Active",
    disabled: "Disabled",
  },
  locked: "Custom domains are not included",
  lockedDescription: "An active paid plan that includes custom domains is required before a hostname can be submitted.",
  none: "No domain is submitted.",
  txtName: "TXT name",
  txtValue: "TXT value",
  routingTitle: "DNS routing",
  routingBody:
    "Point the hostname at this deployment with the records your host shows. On Vercel, add the domain under Project Settings → Domains and copy the records from that screen. Menor does not create those records.",
  certificateTitle: "Certificate",
  certificateBody:
    "The hosting provider issues the certificate after it accepts the hostname. Menor does not request or store a certificate.",
  activationTitle: "Activation",
  activationBody:
    "Verified means the TXT record matched. It does not mean the menu is served on that hostname. This deployment has no hosting API token, so the dashboard cannot attach the domain or mark it active. After the host accepts the domain and the certificate is issued, run select public.activate_custom_domain('<domain id>'); in the database SQL editor.",
  verifiedNote: "Ownership is confirmed. The menu is not served on this hostname yet.",
  activeNote: "Menor will route this hostname to the published menu when the host sends traffic here.",
  notices: {
    submitted: "The domain is pending. Add the TXT record, then check DNS.",
    verified: "The TXT record matched. The domain is verified and is not active.",
    missing: "The TXT record was not found yet.",
    mismatch: "The TXT record does not match this domain.",
    dns_error: "The DNS lookup did not complete. Try again in a minute.",
    invalid: "Enter a domain name such as menu.example.com.",
    taken: "That hostname is already assigned.",
    exists: "Remove the current domain before submitting another.",
    locked: "The current plan does not include custom domains.",
    removed: "The domain was removed.",
    rate_limited: "Wait a moment before checking DNS again.",
    unconfigured: "Domain checks are not configured in this environment yet.",
    forbidden: "You do not have access to this domain.",
    failed: "The domain could not be saved.",
    confirm: "Confirm the removal before continuing.",
  },
};

export const insightsCopyAr: InsightsCopy = {
  analytics: "التحليلات",
  analyticsDescription: "تابع كيف يشاهد الناس قائمتك واكتشف الأصناف الأكثر شعبية.",
  privacy: "لا تُخزَّن عناوين الزوار ولا تُعرض.",
  rangeInvalid: "يجب أن يكون تاريخ البداية في يوم النهاية أو قبله، وضمن نافذة التحليلات لهذه الخطة.",
  vsPrevious: "مقارنة بالأيام الـ {count} السابقة",
  days7: "7 أيام",
  days30: "30 يومًا",
  days90: "90 يومًا",
  dailyTitle: "الإحصاءات اليومية",
  exportCsv: "تصدير",
  productsEmptyTitle: "لا توجد مشاهدات للمنتجات بعد",
  productsEmptyBody: "ستظهر المنتجات هنا عندما يشاهدها الزوار من قائمتك.",
  categoriesEmptyTitle: "لا توجد مشاهدات للتصنيفات بعد",
  categoriesEmptyBody: "ستظهر التصنيفات هنا عندما يشاهد الزوار منتجات ضمنها.",
  breakdownEmpty: "لا توجد مشاهدات للقائمة في هذه الفترة.",
  deviceNote: "تُحسب من مشاهدات القائمة.",
  sourceNote: "تُحسب من مشاهدات القائمة. الزيارة بلا مُحيل تُعد مباشرة.",
  domain: "نطاق خاص",
  domainDescription: "اربط نطاقك الخاص ليحصل منيو مطعمك على عنوان احترافي.",
  from: "من",
  to: "إلى",
  apply: "تطبيق",
  menuViews: "مشاهدات القائمة",
  productViews: "مشاهدات المنتجات",
  byDay: "المشاهدات حسب اليوم",
  byDevice: "توزيع الأجهزة",
  byReferrer: "مصدر الزيارات",
  products: "المنتجات الأكثر مشاهدة",
  categories: "التصنيفات الشائعة",
  empty: "لا توجد مشاهدات في هذه الفترة.",
  retention: "تشمل هذه الخطة المشاهدات منذ",
  day: "اليوم",
  views: "المشاهدات",
  previous: "السابق",
  next: "التالي",
  devices: { mobile: "جوال", tablet: "جهاز لوحي", desktop: "حاسوب", unknown: "غير معروف" },
  sources: { direct: "مباشر", search: "بحث", social: "تواصل", other: "مواقع أخرى" },
  hostname: "اسم النطاق",
  connectTitle: "اربط نطاقك",
  connectDescription: "أدخل اسم نطاق تملكه. تتحقق مينور من سجلات DNS المطلوبة قبل توثيقه.",
  hostnameHint: "استخدم اسم نطاق مثل menu.example.com. لا يُقبل عنوان موقع كامل.",
  adding: "جار الإضافة",
  checking: "جار التحقق",
  learnMore: "مزيد عن النطاقات الخاصة",
  statusTitle: "حالة النطاق",
  noDomainTitle: "لا يوجد نطاق مرتبط",
  notConfigured: "غير مُعد",
  viewPlans: "عرض الخطط",
  premiumTitle: "النطاقات الخاصة ميزة مدفوعة",
  dnsTitle: "إعداد DNS",
  dnsIntro: "افتح مزود DNS، أضف السجل الظاهر هنا، وانتظر حتى ينتشر التغيير.",
  dnsEmpty: "أضف نطاقًا لرؤية سجل TXT الذي تستطيع مينور التحقق منه. لا يوجد لدى مينور عنوان توجيه لعرضه.",
  dnsWait: "أضف سجل TXT ثم اختر التحقق من DNS. حفظ اسم النطاق لا يعني أنه موثّق.",
  recordType: "النوع",
  recordHost: "الاسم / المضيف",
  recordValue: "القيمة",
  copyValue: "نسخ",
  copied: "تم النسخ",
  visit: "زيارة النطاق",
  verifiedAt: "تم التوثيق",
  lastChecked: "آخر تحقق",
  stepsTitle: "الإعداد",
  steps: {
    add: "إضافة النطاق",
    addHint: "أدخل اسم النطاق",
    dns: "إعداد DNS",
    dnsHint: "أضف سجل TXT",
    verify: "التحقق من الربط",
    verifyHint: "تتحقق مينور من سجل TXT",
    serve: "التفعيل",
    serveHint: "يحتاج إعداد الاستضافة",
  },
  stepNeedsHost: "يحتاج إعداد الاستضافة",
  sslHonest: "مينور لا تؤكد إصدار شهادة. يقوم المستضيف بذلك بعد قبول اسم النطاق.",
  helpTitle: "تحتاج مساعدة لربط النطاق؟",
  helpItems: [
    "أدخل اسم النطاق فقط، مثل menu.example.com.",
    "يجب أن يطابق اسم TXT وقيمته السجل الظاهر هنا.",
    "قد يستغرق انتشار تغييرات DNS بعض الوقت.",
    "أضف اسم النطاق أيضًا لدى مستضيفك. لا تستطيع هذه الصفحة القيام بذلك.",
    "يصدر المستضيف الشهادة. هذه الصفحة لا تعتبر SSL جاهزًا.",
  ],
  domainId: "معرّف النطاق",
  submit: "إضافة نطاق",
  check: "تحقق من DNS",
  remove: "إزالة النطاق",
  confirmRemove: "أريد إزالة هذا النطاق",
  status: "الحالة",
  statuses: {
    pending: "بانتظار التوثيق",
    verified: "موثّق",
    active: "نشط",
    disabled: "متوقف",
  },
  locked: "النطاقات الخاصة غير مشمولة",
  lockedDescription: "يلزم اشتراك مدفوع نشط يشمل النطاقات الخاصة قبل إرسال اسم النطاق.",
  none: "لم يُرسل أي نطاق.",
  txtName: "اسم TXT",
  txtValue: "قيمة TXT",
  routingTitle: "توجيه DNS",
  routingBody:
    "وجّه اسم النطاق إلى هذا النشر باستخدام السجلات التي يعرضها المستضيف. على Vercel، أضف النطاق من إعدادات المشروع ثم انسخ السجلات من تلك الشاشة. مينور لا تنشئ هذه السجلات.",
  certificateTitle: "الشهادة",
  certificateBody: "يصدر المستضيف الشهادة بعد قبول اسم النطاق. مينور لا تطلب شهادة ولا تخزّنها.",
  activationTitle: "التفعيل",
  activationBody:
    "التوثيق يعني أن سجل TXT مطابق. لا يعني أن القائمة تُعرض على هذا النطاق. لا يوجد رمز لاستضافة النطاق في هذه البيئة، لذلك لا تستطيع اللوحة ربط النطاق أو جعله نشطًا. بعد أن يقبل المستضيف النطاق وتصدر الشهادة، نفّذ select public.activate_custom_domain('<domain id>'); في محرر SQL.",
  verifiedNote: "تم تأكيد الملكية. القائمة لا تُعرض على هذا النطاق بعد.",
  activeNote: "ستوجه مينور هذا النطاق إلى القائمة المنشورة عندما يصل الزوار عبر المستضيف.",
  notices: {
    submitted: "النطاق قيد الانتظار. أضف سجل TXT ثم تحقق من DNS.",
    verified: "تطابق سجل TXT. النطاق موثّق وليس نشطًا.",
    missing: "لم يُعثر على سجل TXT بعد.",
    mismatch: "سجل TXT لا يطابق هذا النطاق.",
    dns_error: "لم يكتمل فحص DNS. أعد المحاولة بعد دقيقة.",
    invalid: "أدخل اسم نطاق مثل menu.example.com.",
    taken: "اسم النطاق مستخدم بالفعل.",
    exists: "أزل النطاق الحالي قبل إرسال نطاق آخر.",
    locked: "الخطة الحالية لا تشمل النطاقات الخاصة.",
    removed: "تمت إزالة النطاق.",
    rate_limited: "انتظر قليلًا قبل إعادة فحص DNS.",
    unconfigured: "فحوصات النطاق غير معدة في هذه البيئة بعد.",
    forbidden: "لا تملك صلاحية هذا النطاق.",
    failed: "تعذر حفظ النطاق.",
    confirm: "أكّد الإزالة قبل المتابعة.",
  },
};
