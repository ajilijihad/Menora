import type { EmailTemplateName } from "@/lib/email/messages";

export type BillingCopy = {
  nav: string;
  title: string;
  description: string;
  current: string;
  status: string;
  period: string;
  openEnded: string;
  requested: string;
  products: string;
  businesses: string;
  themes: string;
  analytics: string;
  domains: string;
  domainsYes: string;
  domainsNo: string;
  choose: string;
  request: string;
  useFree: string;
  cancelPaid: string;
  upgradeTitle: string;
  upgradeDescription: string;
  upgradeAction: string;
  adminTitle: string;
  adminDescription: string;
  savePlan: string;
  activate: string;
  renew: string;
  expire: string;
  cancel: string;
  price: string;
  limits: string;
  active: string;
  payMonth: string;
  history: string;
  amountLabel: string;
  expiration: string;
  manualRenewal: string;
  latestPayment: string;
  noPayments: string;
  refundTitle: string;
  refundDescription: string;
  refundAction: string;
  paymentId: string;
  receipt: string;
  receiptNotice: string;
  businessName: string;
  paidAt: string;
  transactionReference: string;
  printReceipt: string;
  pageTitle: string;
  pageDescription: string;
  breadcrumbSettings: string;
  breadcrumbDashboard: string;
  noPaymentDue: string;
  billingPeriod: string;
  upgradeHint: string;
  managePlan: string;
  currentPlanAction: string;
  forever: string;
  perMonth: string;
  usageLine: string;
  oneBusiness: string;
  manyBusinesses: string;
  productLimit: string;
  themeLimit: string;
  analyticsLimit: string;
  historyDescription: string;
  historyEmptyTitle: string;
  historyEmptyBody: string;
  refresh: string;
  date: string;
  descriptionColumn: string;
  oneMonth: string;
  supportTitle: string;
  supportBody: string;
  emailPreview: string;
  emailPreviewDescription: string;
  sendTest: string;
  emailStudio: {
    transactional: string;
    resendReady: string;
    resendMissingFrom: string;
    resendMissing: string;
    groups: { account: string; payments: string; reminders: string };
    templates: Record<EmailTemplateName, { name: string; description: string }>;
    preview: string;
    subject: string;
    refreshPreview: string;
    copySubject: string;
    copied: string;
    copyFailed: string;
    expand: string;
    collapse: string;
    sample: string;
    sampleNote: string;
    details: string;
    identifier: string;
    language: string;
    category: string;
    testSupport: string;
    yes: string;
    english: string;
    arabic: string;
    bothLanguages: string;
    recipient: string;
    recipientMissing: string;
    sending: string;
    confirmTitle: string;
    confirmBody: string;
    confirmSend: string;
    cancel: string;
  };
  paymentStatuses: {
    pending: string;
    completed: string;
    failed: string;
    refunded: string;
    canceled: string;
  };
  statuses: {
    pending: string;
    active: string;
    past_due: string;
    canceled: string;
    expired: string;
  };
  messages: {
    requested: string;
    saved: string;
    activated: string;
    renewed: string;
    expired: string;
    canceled: string;
    plan_invalid: string;
    forbidden: string;
    not_found: string;
    unconfigured: string;
    save_failed: string;
    paid: string;
    payment_failed: string;
    checkout_failed: string;
    live_not_released: string;
    checkout_canceled: string;
    refunded: string;
    test_sent: string;
    test_failed: string;
  };
};

export const billingCopyEn: BillingCopy = {
  nav: "Plan",
  title: "Plan",
  description: "Each payment covers one month. Menor does not bill the next month automatically. Opening the return page does not activate a plan.",
  current: "Current plan",
  status: "Status",
  period: "Current period",
  openEnded: "No expiration",
  requested: "Requested plan",
  products: "Products",
  businesses: "Businesses",
  themes: "Layouts",
  analytics: "Analytics retention",
  domains: "Custom domains",
  domainsYes: "Included",
  domainsNo: "Not included",
  choose: "Available plans",
  request: "Request this plan",
  useFree: "Use Free",
  cancelPaid: "Return to Free",
  upgradeTitle: "Plan limit reached",
  upgradeDescription: "This action is above the current plan. Pay for one month of a higher plan on the billing page.",
  upgradeAction: "View plans",
  adminTitle: "Plans and subscriptions",
  adminDescription: "Edit prices and limits here. Activating or renewing a plan from this screen does not charge PayPal. A refund uses the stored capture and shortens that paid month.",
  savePlan: "Save plan",
  activate: "Activate request",
  renew: "Renew one month",
  expire: "Mark expired",
  cancel: "Cancel",
  price: "Price in minor units",
  limits: "Limits",
  active: "Active in the catalog",
  payMonth: "Pay for one month",
  history: "Payment history",
  amountLabel: "Amount",
  expiration: "Expiration",
  manualRenewal: "Pay again before the expiration date to keep a paid plan.",
  latestPayment: "Latest payment",
  noPayments: "No payments yet.",
  refundTitle: "Refund a captured payment",
  refundDescription: "Refunds the full stored amount for one completed PayPal payment and shortens the month that payment granted.",
  refundAction: "Refund payment",
  paymentId: "Payment id",
  receipt: "Payment receipt",
  receiptNotice: "This is a payment receipt for your records. It is not a tax invoice.",
  businessName: "Business",
  paidAt: "Payment date",
  transactionReference: "Transaction reference",
  printReceipt: "Print receipt",
  pageTitle: "Billing & subscription",
  pageDescription: "One subscription covers your account. Every business you add, up to the plan limit, gets the same features. When the subscription ends or you cancel it, every business returns to Free.",
  breadcrumbSettings: "Settings",
  breadcrumbDashboard: "Dashboard",
  noPaymentDue: "No payment due",
  billingPeriod: "Billing period",
  upgradeHint: "Upgrade whenever you're ready.",
  managePlan: "Manage plan",
  currentPlanAction: "Current plan",
  forever: "forever",
  perMonth: "/ month",
  usageLine: "{used} of {limit}",
  oneBusiness: "1 business on your account",
  manyBusinesses: "Up to {count} businesses, each with these features",
  productLimit: "Up to {count} products on each business",
  themeLimit: "{count} menu layouts on each business",
  analyticsLimit: "{count} days of analytics on each business",
  historyDescription: "Your completed payments and receipts will appear here.",
  historyEmptyTitle: "No payments yet",
  historyEmptyBody: "Your completed payments and receipts will appear here.",
  refresh: "Refresh",
  date: "Date",
  descriptionColumn: "Description",
  oneMonth: "One month",
  supportTitle: "Need help with billing?",
  supportBody: "If you have any questions about your subscription or payments, our support team is here to help.",
  emailPreview: "Email templates",
  emailPreviewDescription: "Preview, review, and test transactional emails sent by Menor.",
  sendTest: "Send test email",
  emailStudio: {
    transactional: "Transactional",
    resendReady: "Resend is configured",
    resendMissingFrom: "Resend from address is missing",
    resendMissing: "Resend is not configured",
    groups: { account: "Account", payments: "Payments", reminders: "Subscription reminders" },
    templates: {
      welcome: { name: "Welcome email", description: "Sent when an account is ready." },
      payment_receipt: { name: "Payment receipt", description: "Sent after a successful payment." },
      renewal_confirmation: { name: "Renewal confirmation", description: "Sent when a subscription is renewed." },
      payment_failed: { name: "Payment failed", description: "Sent when a payment is not completed." },
      reminder_7: { name: "Reminder — 7 days", description: "Sent 7 days before expiration." },
      reminder_3: { name: "Reminder — 3 days", description: "Sent 3 days before expiration." },
      reminder_1: { name: "Reminder — 1 day", description: "Sent 1 day before expiration." },
      subscription_expired: { name: "Subscription expired", description: "Sent when a paid period ends." },
    },
    preview: "Preview",
    subject: "Email subject",
    refreshPreview: "Refresh",
    copySubject: "Copy subject",
    copied: "Subject copied",
    copyFailed: "Could not copy the subject",
    expand: "Expand",
    collapse: "Close",
    sample: "Sample data",
    sampleNote: "This preview uses sample details. It is not a customer record.",
    details: "Details",
    identifier: "Template identifier",
    language: "Language",
    category: "Category",
    testSupport: "Supports test email",
    yes: "Yes",
    english: "English",
    arabic: "العربية",
    bothLanguages: "EN · AR",
    recipient: "The test email is sent only to {email}.",
    recipientMissing: "Add an email to your administrator account before sending a test.",
    sending: "Sending…",
    confirmTitle: "Send this test email?",
    confirmBody: "{template} in {language} will be sent to {email}.",
    confirmSend: "Send test",
    cancel: "Cancel",
  },
  paymentStatuses: {
    pending: "Pending",
    completed: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    canceled: "Cancelled",
  },
  statuses: {
    pending: "Pending",
    active: "Active",
    past_due: "Past due",
    canceled: "Cancelled",
    expired: "Expired",
  },
  messages: {
    requested: "The paid plan was requested. It stays inactive until a verified payment or an administrator activates it.",
    saved: "The plan was saved.",
    activated: "The requested plan is now active for one month.",
    renewed: "The paid plan was renewed for one month. No payment was collected.",
    expired: "The subscription is expired. Paid limits no longer apply.",
    canceled: "The paid plan was cancelled. Every business on the account is on Free.",
    plan_invalid: "That plan change is not available.",
    forbidden: "You do not have permission to change this plan.",
    not_found: "That subscription is not available.",
    unconfigured: "Billing storage is not configured in this environment yet.",
    save_failed: "We could not save that billing change. Try again.",
    paid: "Payment received. This plan is active for one month.",
    payment_failed: "The payment was not completed. The plan was not extended.",
    checkout_failed: "PayPal did not start this checkout. No plan was changed.",
    live_not_released: "Live PayPal payments are not enabled. Sandbox is the development environment.",
    checkout_canceled: "The checkout was cancelled. No plan was changed.",
    refunded: "The payment was refunded and the granted month was removed.",
    test_sent: "The test email was sent.",
    test_failed: "The test email was not sent.",
  },
};

export const billingCopyAr: BillingCopy = {
  nav: "الخطة",
  title: "الخطة",
  description: "كل دفعة تغطي شهرًا واحدًا. لا يخصم مينور الشهر التالي تلقائيًا. فتح صفحة العودة لا يفعّل الخطة.",
  current: "الخطة الحالية",
  status: "الحالة",
  period: "الفترة الحالية",
  openEnded: "بلا تاريخ انتهاء",
  requested: "الخطة المطلوبة",
  products: "المنتجات",
  businesses: "الأعمال",
  themes: "التخطيطات",
  analytics: "مدة الاحتفاظ بالتحليلات",
  domains: "النطاقات الخاصة",
  domainsYes: "مشمولة",
  domainsNo: "غير مشمولة",
  choose: "الخطط المتاحة",
  request: "طلب هذه الخطة",
  useFree: "استخدام المجانية",
  cancelPaid: "العودة إلى المجانية",
  upgradeTitle: "تم بلوغ حد الخطة",
  upgradeDescription: "هذا الإجراء أعلى من الخطة الحالية. ادفع شهرًا واحدًا من خطة أعلى في صفحة الفوترة.",
  upgradeAction: "عرض الخطط",
  adminTitle: "الخطط والاشتراكات",
  adminDescription: "عدّل الأسعار والحدود هنا. تفعيل خطة أو تجديدها من هذه الشاشة لا يخصم مبلغًا عبر PayPal. الاسترداد يستخدم عملية القبض المحفوظة ويقصّر الشهر الذي منحته تلك الدفعة.",
  savePlan: "حفظ الخطة",
  activate: "تفعيل الطلب",
  renew: "تجديد شهر واحد",
  expire: "تعليمها منتهية",
  cancel: "إلغاء",
  price: "السعر بالوحدة الصغرى",
  limits: "الحدود",
  active: "ظاهرة في قائمة الخطط",
  payMonth: "ادفع لشهر واحد",
  history: "سجل الدفعات",
  amountLabel: "المبلغ",
  expiration: "تاريخ الانتهاء",
  manualRenewal: "ادفع مرة أخرى قبل تاريخ الانتهاء للإبقاء على الخطة المدفوعة.",
  latestPayment: "آخر دفعة",
  noPayments: "لا توجد دفعات بعد.",
  refundTitle: "استرداد دفعة مقبوضة",
  refundDescription: "يسترد المبلغ المحفوظ كاملًا لدفعة PayPal مكتملة ويقصّر الشهر الذي منحته تلك الدفعة.",
  refundAction: "استرداد الدفعة",
  paymentId: "معرّف الدفعة",
  receipt: "إيصال دفع",
  receiptNotice: "هذا إيصال دفع لسجلاتك. ليس فاتورة ضريبية.",
  businessName: "العمل",
  paidAt: "تاريخ الدفع",
  transactionReference: "مرجع العملية",
  printReceipt: "طباعة الإيصال",
  pageTitle: "الاشتراك والفوترة",
  pageDescription: "اشتراك واحد يغطي حسابك. كل نشاط تضيفه، حتى حد الخطة، يحصل على المميزات نفسها. عند انتهاء الاشتراك أو إلغائه تعود كل النشاطات إلى الخطة المجانية.",
  breadcrumbSettings: "الإعدادات",
  breadcrumbDashboard: "لوحة الحساب",
  noPaymentDue: "لا توجد دفعة مستحقة",
  billingPeriod: "فترة الفوترة",
  upgradeHint: "يمكنك الترقية عندما تكون جاهزًا.",
  managePlan: "إدارة الخطة",
  currentPlanAction: "الخطة الحالية",
  forever: "مدى الحياة",
  perMonth: "/ شهر",
  usageLine: "{used} من {limit}",
  oneBusiness: "نشاط واحد في حسابك",
  manyBusinesses: "حتى {count} نشاطات، ولكل منها هذه المميزات",
  productLimit: "حتى {count} منتج في كل نشاط",
  themeLimit: "{count} تخطيطات في كل نشاط",
  analyticsLimit: "{count} يومًا من التحليلات لكل نشاط",
  historyDescription: "ستظهر هنا الدفعات المكتملة والإيصالات.",
  historyEmptyTitle: "لا توجد دفعات بعد",
  historyEmptyBody: "ستظهر هنا الدفعات المكتملة والإيصالات.",
  refresh: "تحديث",
  date: "التاريخ",
  descriptionColumn: "الوصف",
  oneMonth: "شهر واحد",
  supportTitle: "تحتاج مساعدة في الفوترة؟",
  supportBody: "إذا كان لديك سؤال عن الاشتراك أو الدفعات، ففريق الدعم جاهز للمساعدة.",
  emailPreview: "قوالب البريد",
  emailPreviewDescription: "عاين وراجع واختبر رسائل المعاملات التي يرسلها مينور.",
  sendTest: "إرسال بريد تجريبي",
  emailStudio: {
    transactional: "معاملات",
    resendReady: "Resend مُعد",
    resendMissingFrom: "عنوان المرسل في Resend غير موجود",
    resendMissing: "Resend غير مُعد",
    groups: { account: "الحساب", payments: "المدفوعات", reminders: "تذكيرات الاشتراك" },
    templates: {
      welcome: { name: "رسالة الترحيب", description: "تُرسل عندما يصبح الحساب جاهزًا." },
      payment_receipt: { name: "إيصال الدفع", description: "تُرسل بعد دفعة ناجحة." },
      renewal_confirmation: { name: "تأكيد التجديد", description: "تُرسل عند تجديد الاشتراك." },
      payment_failed: { name: "فشل الدفع", description: "تُرسل عندما لا تكتمل الدفعة." },
      reminder_7: { name: "تذكير — 7 أيام", description: "تُرسل قبل 7 أيام من الانتهاء." },
      reminder_3: { name: "تذكير — 3 أيام", description: "تُرسل قبل 3 أيام من الانتهاء." },
      reminder_1: { name: "تذكير — يوم واحد", description: "تُرسل قبل يوم من الانتهاء." },
      subscription_expired: { name: "انتهى الاشتراك", description: "تُرسل عند انتهاء الفترة المدفوعة." },
    },
    preview: "المعاينة",
    subject: "موضوع الرسالة",
    refreshPreview: "تحديث",
    copySubject: "نسخ الموضوع",
    copied: "تم نسخ الموضوع",
    copyFailed: "تعذر نسخ الموضوع",
    expand: "توسيع",
    collapse: "إغلاق",
    sample: "بيانات تجريبية",
    sampleNote: "تستخدم هذه المعاينة تفاصيل تجريبية. ليست سجل عميل.",
    details: "التفاصيل",
    identifier: "معرّف القالب",
    language: "اللغة",
    category: "الفئة",
    testSupport: "يدعم البريد التجريبي",
    yes: "نعم",
    english: "English",
    arabic: "العربية",
    bothLanguages: "EN · AR",
    recipient: "يصل البريد التجريبي إلى {email} فقط.",
    recipientMissing: "أضف بريدًا إلى حساب المسؤول قبل إرسال تجربة.",
    sending: "جارٍ الإرسال…",
    confirmTitle: "إرسال هذا البريد التجريبي؟",
    confirmBody: "سيُرسل {template} باللغة {language} إلى {email}.",
    confirmSend: "إرسال التجربة",
    cancel: "إلغاء",
  },
  paymentStatuses: {
    pending: "قيد الانتظار",
    completed: "مدفوعة",
    failed: "فشلت",
    refunded: "مستردة",
    canceled: "ملغاة",
  },
  statuses: {
    pending: "قيد الانتظار",
    active: "نشطة",
    past_due: "متأخرة",
    canceled: "ملغاة",
    expired: "منتهية",
  },
  messages: {
    requested: "طُلبت الخطة المدفوعة. تبقى غير مفعّلة إلى أن تؤكد دفعة أو يفعّلها مسؤول.",
    saved: "تم حفظ الخطة.",
    activated: "أصبحت الخطة المطلوبة نشطة لشهر واحد.",
    renewed: "تم تجديد الخطة المدفوعة لشهر واحد. لم يُحصَّل أي مبلغ.",
    expired: "انتهى الاشتراك. لم تعد حدود الخطة المدفوعة سارية.",
    canceled: "أُلغيت الخطة المدفوعة. كل النشاطات في الحساب على الخطة المجانية.",
    plan_invalid: "تغيير الخطة هذا غير متاح.",
    forbidden: "ليست لديك صلاحية لتغيير هذه الخطة.",
    not_found: "هذا الاشتراك غير متاح.",
    unconfigured: "تخزين الفوترة غير مُعد في هذه البيئة بعد.",
    save_failed: "تعذر حفظ تغيير الفوترة. حاول مرة أخرى.",
    paid: "تم استلام الدفعة. هذه الخطة نشطة لشهر واحد.",
    payment_failed: "لم تكتمل الدفعة. لم تُمدَّد الخطة.",
    checkout_failed: "لم يبدأ PayPal عملية الدفع. لم تتغير الخطة.",
    live_not_released: "دفعات PayPal الحقيقية غير مفعّلة. بيئة التطوير هي Sandbox.",
    checkout_canceled: "أُلغيت عملية الدفع. لم تتغير الخطة.",
    refunded: "تم استرداد الدفعة وأُزيل الشهر الذي منحته.",
    test_sent: "تم إرسال البريد التجريبي.",
    test_failed: "لم يُرسل البريد التجريبي.",
  },
};
