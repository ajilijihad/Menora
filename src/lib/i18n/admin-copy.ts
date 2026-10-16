export type AdminCopy = {
  title: string;
  description: string;
  deniedTitle: string;
  deniedDescription: string;
  backToDashboard: string;
  navOverview: string;
  navBusinesses: string;
  navUsers: string;
  navPlans: string;
  navSubscriptions: string;
  navPayments: string;
  navEmails: string;
  navDomains: string;
  navAnalytics: string;
  navPreview: string;
  navHome: string;
  range7: string;
  range30: string;
  range90: string;
  from: string;
  to: string;
  exportReport: string;
  currentTotal: string;
  addedInPeriod: string;
  inThisRange: string;
  vsPrevious: string;
  growthTitle: string;
  growthDescription: string;
  growthEmpty: string;
  growthIncomplete: string;
  newBusinesses: string;
  newUsers: string;
  subscriptionsTitle: string;
  subscriptionsDescription: string;
  subscriptionsEmpty: string;
  subscriptionsNote: string;
  activityTitle: string;
  activityDescription: string;
  activityEmpty: string;
  activityFailed: string;
  recorded: string;
  administrator: string;
  you: string;
  attentionTitle: string;
  attentionDescription: string;
  attentionEmpty: string;
  attentionFailedEmails: string;
  attentionFailedEmailsDetail: string;
  attentionPending: string;
  attentionPendingDetail: string;
  attentionExpired: string;
  attentionExpiredDetail: string;
  attentionDomains: string;
  attentionDomainsDetail: string;
  attentionPayments: string;
  attentionPaymentsDetail: string;
  attentionPastDue: string;
  attentionPastDueDetail: string;
  revenue: string;
  revenueDetail: string;
  revenueMixed: string;
  revenueNone: string;
  revenueUnavailable: string;
  activeBusinesses: string;
  columnDate: string;
  columnAdministrator: string;
  columnStatus: string;
  auditActions: {
    plan_created: string;
    plan_updated: string;
    subscription_activate: string;
    subscription_renew: string;
    subscription_expire: string;
    subscription_cancel: string;
    business_suspended: string;
    business_reactivated: string;
    payment_refund: string;
    plan_granted: string;
  };
  upgradePlan: string;
  upgradeNote: string;
  noBusiness: string;
  noPlan: string;
  noUpgrade: string;
  selectUser: string;
  search: string;
  status: string;
  all: string;
  apply: string;
  previous: string;
  next: string;
  empty: string;
  page: string;
  reason: string;
  confirm: string;
  recordId: string;
  applyChange: string;
  planCode: string;
  details: string;
  queued: string;
  sent: string;
  failed: string;
  emailsDescription: string;
  emailsSearch: string;
  copyMessage: string;
  save: string;
  create: string;
  suspend: string;
  reactivate: string;
  operation: string;
  activate: string;
  renew: string;
  expire: string;
  cancel: string;
  refund: string;
  appointed: string;
  member: string;
  paymentNote: string;
  paymentsSearch: string;
  paymentsIdPlaceholder: string;
  paymentsReasonPlaceholder: string;
  paymentsCopy: string;
  appointmentNote: string;
  adjustmentNote: string;
  analyticsNote: string;
  auditTitle: string;
  metrics: {
    businesses: string;
    suspended: string;
    users: string;
    activeSubscriptions: string;
    pendingSubscriptions: string;
    expiredSubscriptions: string;
    completedPayments: string;
    failedEmails: string;
    domains: string;
    menuViews7d: string;
  };
  columns: {
    business: string;
    owner: string;
    user: string;
    email: string;
    plan: string;
    amount: string;
    reference: string;
    order: string;
    refundReference: string;
    domain: string;
    template: string;
    provider: string;
    when: string;
    action: string;
  };
  businessStatuses: {
    draft: string;
    active: string;
    archived: string;
    suspended: string;
  };
  analyticsLabels: {
    menu7: string;
    product7: string;
    menu30: string;
    product30: string;
  };
  analyticsPage: {
    description: string;
    note: string;
    days7: string;
    days30: string;
    days90: string;
    from: string;
    to: string;
    apply: string;
    collected: string;
    collectedHint: string;
    refunds: string;
    refundsHint: string;
    net: string;
    netHint: string;
    failed: string;
    failedHint: string;
    none: string;
    unavailable: string;
    vsPrevious: string;
    chartTitle: string;
    chartHint: string;
    chartEmpty: string;
    plansTitle: string;
    plansEmpty: string;
    unassignedPlan: string;
    payments: string;
    outcomes: string;
    pending: string;
    completed: string;
    refunded: string;
    openPayments: string;
    dailyTitle: string;
    dailyHint: string;
    date: string;
    currency: string;
    exportCsv: string;
  };
  plansPage: {
    description: string;
    activePlans: string;
    activePlansHint: string;
    subscribers: string;
    subscribersHint: string;
    mrr: string;
    mrrHint: string;
    mrrUnavailable: string;
    mrrNone: string;
    allPlans: string;
    active: string;
    draft: string;
    searchPlaceholder: string;
    allCurrencies: string;
    columnPlan: string;
    columnPrice: string;
    columnBusinesses: string;
    columnProducts: string;
    columnLayouts: string;
    columnAnalytics: string;
    columnDomains: string;
    columnStatus: string;
    columnActions: string;
    edit: string;
    more: string;
    activate: string;
    deactivate: string;
    included: string;
    notIncluded: string;
    days: string;
    perMonth: string;
    empty: string;
    unavailable: string;
    createTitle: string;
    createHint: string;
    editTitle: string;
    editHint: string;
    basic: string;
    pricing: string;
    features: string;
    code: string;
    codePlaceholder: string;
    name: string;
    namePlaceholder: string;
    planDescription: string;
    planDescriptionPlaceholder: string;
    price: string;
    currency: string;
    interval: string;
    monthly: string;
    intervalNote: string;
    businessLimit: string;
    productLimit: string;
    layoutLimit: string;
    retention: string;
    catalog: string;
    catalogHint: string;
    domains: string;
    domainsHint: string;
    reason: string;
    reasonPlaceholder: string;
    reasonHint: string;
    cancel: string;
    save: string;
    confirmTitle: string;
    confirmBody: string;
    confirm: string;
  };
  subscriptionsPage: {
    description: string;
    total: string;
    totalHint: string;
    active: string;
    activeHint: string;
    expiring: string;
    expiringHint: string;
    expired: string;
    expiredHint: string;
    unavailable: string;
    searchPlaceholder: string;
    recordId: string;
    account: string;
    businessCount: string;
    plan: string;
    expiration: string;
    createdAt: string;
    actions: string;
    manage: string;
    copyId: string;
    copied: string;
    noExpiration: string;
    showing: string;
    perPage: string;
    updateTitle: string;
    updateHint: string;
    idPlaceholder: string;
    selected: string;
    reasonPlaceholder: string;
    reasonHint: string;
    confirmTitle: string;
    confirmBody: string;
    confirm: string;
    clear: string;
  };
  messages: {
    saved: string;
    created: string;
    forbidden: string;
    invalid: string;
    failed: string;
    suspended: string;
    reactivated: string;
    adjusted: string;
    refunded: string;
    audit_failed: string;
    unconfigured: string;
    not_found: string;
    granted: string;
    reason_short: string;
  };
};

export const adminCopyEn: AdminCopy = {
  title: "Platform administration",
  description: "Monitor your platform, manage businesses, subscriptions, and payments.",
  deniedTitle: "You do not have access",
  deniedDescription: "This account is not a platform administrator.",
  backToDashboard: "Back to the dashboard",
  navOverview: "Overview",
  navBusinesses: "Businesses",
  navUsers: "Users",
  navPlans: "Plans",
  navSubscriptions: "Subscriptions",
  navPayments: "Payments",
  navEmails: "Email logs",
  navDomains: "Domains",
  navAnalytics: "Analytics",
  navPreview: "Email",
  navHome: "Home page",
  range7: "Last 7 days",
  range30: "Last 30 days",
  range90: "Last 90 days",
  from: "From",
  to: "To",
  exportReport: "Export report",
  currentTotal: "Current total",
  addedInPeriod: "{count} new in this period",
  inThisRange: "{count} in this range",
  vsPrevious: "vs previous period",
  growthTitle: "Platform growth",
  growthDescription: "New businesses and users over time.",
  growthEmpty: "No businesses or users were added in this range.",
  growthIncomplete: "This range has too many records to chart day by day. The totals above are still exact.",
  newBusinesses: "New businesses",
  newUsers: "New users",
  subscriptionsTitle: "Subscription overview",
  subscriptionsDescription: "Every subscription, counted by its current status.",
  subscriptionsEmpty: "No subscriptions yet.",
  subscriptionsNote: "Canceled subscriptions are counted separately from expired ones.",
  activityTitle: "Recent activity",
  activityDescription: "Latest administrative actions across the platform.",
  activityEmpty: "No administrative actions have been recorded.",
  activityFailed: "The activity log could not be loaded.",
  recorded: "Recorded",
  administrator: "Administrator",
  you: "You",
  attentionTitle: "Needs attention",
  attentionDescription: "Items that require your review or action.",
  attentionEmpty: "Nothing needs attention right now.",
  attentionFailedEmails: "Failed emails",
  attentionFailedEmailsDetail: "{count} emails failed to send.",
  attentionPending: "Pending subscription reviews",
  attentionPendingDetail: "{count} subscriptions are pending activation.",
  attentionExpired: "Expired subscriptions",
  attentionExpiredDetail: "{count} subscriptions have expired.",
  attentionDomains: "Domains needing verification",
  attentionDomainsDetail: "{count} custom domains are pending DNS verification.",
  attentionPayments: "Failed payments",
  attentionPaymentsDetail: "{count} payments failed.",
  attentionPastDue: "Past due subscriptions",
  attentionPastDueDetail: "{count} subscriptions are past due.",
  revenue: "Revenue",
  revenueDetail: "Gross completed payments in this range.",
  revenueMixed: "Completed payments use more than one currency, so they are listed separately.",
  revenueNone: "No completed payments in this range.",
  revenueUnavailable: "Revenue for this range could not be totaled.",
  activeBusinesses: "Active businesses",
  columnDate: "Date",
  columnAdministrator: "Administrator",
  columnStatus: "Status",
  auditActions: {
    plan_created: "Plan created",
    plan_updated: "Plan updated",
    subscription_activate: "Subscription activated",
    subscription_renew: "Subscription renewed",
    subscription_expire: "Subscription expired",
    subscription_cancel: "Subscription canceled",
    business_suspended: "Business suspended",
    business_reactivated: "Business reactivated",
    payment_refund: "Payment refunded",
    plan_granted: "Plan granted",
  },
  upgradePlan: "Upgrade plan",
  upgradeNote: "This activates the selected plan for one month and does not create a payment.",
  noBusiness: "No business",
  noPlan: "No active plan",
  noUpgrade: "No higher plan is available.",
  selectUser: "Select a user to view their details and update a plan.",
  search: "Search",
  status: "Status",
  all: "All",
  apply: "Apply",
  previous: "Previous",
  next: "Next",
  empty: "Nothing matches this view.",
  page: "Page",
  reason: "Reason",
  confirm: "I confirm this change",
  recordId: "Record id",
  applyChange: "Save change",
  planCode: "Plan code",
  details: "Description",
  queued: "Queued",
  sent: "Sent",
  failed: "Failed",
  emailsDescription: "View and track system emails sent to users.",
  emailsSearch: "Search by email",
  copyMessage: "Copy provider message",
  save: "Save plan",
  create: "Create plan",
  suspend: "Suspend",
  reactivate: "Reactivate",
  operation: "Adjustment",
  activate: "Activate request",
  renew: "Renew one month",
  expire: "Mark expired",
  cancel: "Cancel to Free",
  refund: "Refund payment",
  appointed: "Administrator",
  member: "Member",
  paymentNote: "Completed payments are recorded only after PayPal verifies the capture. This screen cannot create a successful payment.",
  paymentsSearch: "Search by order, capture, or refund reference",
  paymentsIdPlaceholder: "Enter the PayPal payment id",
  paymentsReasonPlaceholder: "Enter the reason for this refund",
  paymentsCopy: "Copy reference",
  appointmentNote: "Administrator access comes from the platform administrator list. Changing a name or profile flag does not appoint anyone.",
  adjustmentNote: "A manual change requires a reason. It records the operator, the time in UTC, and the values before and after the change. It does not create a payment.",
  analyticsNote: "Counts of public menu and product views. Visitor identifiers are not shown.",
  auditTitle: "Recent administrative changes",
  metrics: {
    businesses: "Businesses",
    suspended: "Suspended",
    users: "Users",
    activeSubscriptions: "Active subscriptions",
    pendingSubscriptions: "Pending subscriptions",
    expiredSubscriptions: "Expired subscriptions",
    completedPayments: "Completed payments",
    failedEmails: "Failed emails",
    domains: "Custom domains",
    menuViews7d: "Menu views, 7 days",
  },
  columns: {
    business: "Business",
    owner: "Owner",
    user: "Name",
    email: "Email",
    plan: "Plan",
    amount: "Amount",
    reference: "Capture reference",
    order: "PayPal order",
    refundReference: "Refund reference",
    domain: "Domain",
    template: "Template",
    provider: "Provider message",
    when: "When",
    action: "Action",
  },
  businessStatuses: {
    draft: "Draft",
    active: "Active",
    archived: "Archived",
    suspended: "Suspended",
  },
  analyticsLabels: {
    menu7: "Menu views in 7 days",
    product7: "Product views in 7 days",
    menu30: "Menu views in 30 days",
    product30: "Product views in 30 days",
  },
  analyticsPage: {
    description: "Review collected payments, refunds, and revenue by plan.",
    note: "These amounts are completed PayPal payments. Menor does not record operating costs, so this is not profit after expenses.",
    days7: "Last 7 days",
    days30: "Last 30 days",
    days90: "Last 90 days",
    from: "From",
    to: "To",
    apply: "Apply",
    collected: "Collected",
    collectedHint: "Completed payments in this range.",
    refunds: "Refunds",
    refundsHint: "Payments refunded in this range.",
    net: "Net collected",
    netHint: "Collected minus refunds, kept separate for each currency.",
    failed: "Failed payments",
    failedHint: "Payments that failed in this range.",
    none: "None in this range",
    unavailable: "This range could not be totaled.",
    vsPrevious: "vs previous {count} days",
    chartTitle: "Collected revenue",
    chartHint: "Completed payments by day. Each currency stays separate.",
    chartEmpty: "No completed payments in this range.",
    plansTitle: "Revenue by plan",
    plansEmpty: "No completed payments in this range.",
    unassignedPlan: "Plan not recorded",
    payments: "payments",
    outcomes: "Payment outcomes",
    pending: "Pending",
    completed: "Completed",
    refunded: "Refunded",
    openPayments: "Open payments",
    dailyTitle: "Daily collections",
    dailyHint: "Completed payments and refunds for each day.",
    date: "Date",
    currency: "Currency",
    exportCsv: "Export CSV",
  },
  plansPage: {
    description: "Manage pricing, limits, and availability for your subscription plans.",
    activePlans: "Active plans",
    activePlansHint: "Plans available in the catalog",
    subscribers: "Subscribers",
    subscribersHint: "Active subscriptions still inside their period",
    mrr: "Monthly recurring revenue",
    mrrHint: "Sum of current plan prices",
    mrrUnavailable: "This total is incomplete, so it is hidden.",
    mrrNone: "No current subscriptions",
    allPlans: "All plans",
    active: "Active",
    draft: "Draft",
    searchPlaceholder: "Search plans...",
    allCurrencies: "All currencies",
    columnPlan: "Plan",
    columnPrice: "Price",
    columnBusinesses: "Businesses",
    columnProducts: "Products",
    columnLayouts: "Layouts",
    columnAnalytics: "Analytics",
    columnDomains: "Custom domains",
    columnStatus: "Status",
    columnActions: "Actions",
    edit: "Edit",
    more: "More actions",
    activate: "Activate",
    deactivate: "Deactivate",
    included: "Included",
    notIncluded: "No",
    days: "{count} days",
    perMonth: "/ month",
    empty: "No plans match these filters.",
    unavailable: "Unavailable",
    createTitle: "Create a new plan",
    createHint: "Add a new subscription plan to your platform.",
    editTitle: "Edit plan",
    editHint: "Update this plan. This does not create a payment or change an existing billing period.",
    basic: "Basic details",
    pricing: "Pricing and usage limits",
    features: "Features & availability",
    code: "Plan code",
    codePlaceholder: "e.g. starter",
    name: "Display name",
    namePlaceholder: "e.g. Starter",
    planDescription: "Description",
    planDescriptionPlaceholder: "Brief description of this plan",
    price: "Price in minor units",
    currency: "Currency",
    interval: "Billing interval",
    monthly: "Monthly",
    intervalNote: "Every plan is billed monthly. This cannot be changed.",
    businessLimit: "Businesses limit",
    productLimit: "Products limit",
    layoutLimit: "Layouts limit",
    retention: "Analytics retention (days)",
    catalog: "Available in catalog",
    catalogHint: "Show this plan on the public pricing page.",
    domains: "Custom domains",
    domainsHint: "Allow using custom domains for businesses on this plan.",
    reason: "Reason for change",
    reasonPlaceholder: "e.g. Adding a new plan for small businesses",
    reasonHint: "Required. 8 to 500 characters. Stored in the audit log.",
    cancel: "Cancel",
    save: "Save changes",
    confirmTitle: "Confirm this change",
    confirmBody: "This updates the plan and writes an audit record. It does not create a payment.",
    confirm: "Confirm",
  },
  subscriptionsPage: {
    description: "Each row is one account. The plan covers every business that account owns.",
    total: "Total subscriptions",
    totalHint: "All time",
    active: "Active",
    activeHint: "Currently active",
    expiring: "Expiring soon",
    expiringHint: "In the next 30 days",
    expired: "Expired",
    expiredHint: "Already expired",
    unavailable: "Unavailable",
    searchPlaceholder: "Search by account name, email, plan, or record id...",
    recordId: "Record ID",
    account: "Account",
    businessCount: "{count} businesses",
    plan: "Plan",
    expiration: "Expiration",
    createdAt: "Created at",
    actions: "Actions",
    manage: "Manage",
    copyId: "Copy record ID",
    copied: "Copied",
    noExpiration: "No expiration",
    showing: "Showing {from} to {to} of {total} results",
    perPage: "{count} / page",
    updateTitle: "Update subscription",
    updateHint: "Make a manual change to the subscription. A reason is required and the change will be recorded.",
    idPlaceholder: "Select a subscription from the table or enter the record ID",
    selected: "{account} · {plan} · {status}",
    reasonPlaceholder: "Enter the reason for this change...",
    reasonHint: "Required. 8 to 500 characters. Stored with the administrator and the time in UTC.",
    confirmTitle: "Apply this change?",
    confirmBody: "This updates the subscription and writes an audit record. It does not create a payment.",
    confirm: "Save change",
    clear: "Clear",
  },
  messages: {
    saved: "The plan was saved.",
    created: "The plan was created.",
    forbidden: "That action is limited to platform administrators.",
    invalid: "Check the values and the confirmation, then try again.",
    failed: "The change was not saved.",
    suspended: "The business was suspended and removed from the public menu.",
    reactivated: "The suspension was removed. Publish the menu again when it should be public.",
    adjusted: "The subscription was updated.",
    refunded: "The verified PayPal refund was recorded.",
    audit_failed: "The refund completed, and the audit record was not saved.",
    unconfigured: "Payments are not configured in this environment.",
    not_found: "That record was not found.",
    granted: "The plan is active for one month. No payment was recorded.",
    reason_short: "Enter a reason of at least 8 characters.",
  },
};

export const adminCopyAr: AdminCopy = {
  title: "إدارة المنصة",
  description: "راقب المنصة، وأدر الأعمال والاشتراكات والدفعات.",
  deniedTitle: "ليست لديك صلاحية",
  deniedDescription: "هذا الحساب ليس مسؤول منصة.",
  backToDashboard: "العودة إلى لوحة التحكم",
  navOverview: "نظرة عامة",
  navBusinesses: "الأعمال",
  navUsers: "المستخدمون",
  navPlans: "الخطط",
  navSubscriptions: "الاشتراكات",
  navPayments: "الدفعات",
  navEmails: "سجل البريد",
  navDomains: "النطاقات",
  navAnalytics: "التحليلات",
  navPreview: " البريد",
  navHome: "الصفحة الرئيسية",
  range7: "آخر 7 أيام",
  range30: "آخر 30 يومًا",
  range90: "آخر 90 يومًا",
  from: "من",
  to: "إلى",
  exportReport: "تصدير التقرير",
  currentTotal: "الإجمالي الحالي",
  addedInPeriod: "{count} جديد في هذه الفترة",
  inThisRange: "{count} في هذا النطاق",
  vsPrevious: "مقارنة بالفترة السابقة",
  growthTitle: "نمو المنصة",
  growthDescription: "الأعمال والمستخدمون الجدد عبر الوقت.",
  growthEmpty: "لم تُضف أعمال أو مستخدمون في هذا النطاق.",
  growthIncomplete: "يحتوي هذا النطاق على سجلات أكثر مما يمكن رسمه يومًا بيوم. الإجماليات أعلاه تبقى دقيقة.",
  newBusinesses: "أعمال جديدة",
  newUsers: "مستخدمون جدد",
  subscriptionsTitle: "نظرة على الاشتراكات",
  subscriptionsDescription: "كل الاشتراكات حسب حالتها الحالية.",
  subscriptionsEmpty: "لا توجد اشتراكات بعد.",
  subscriptionsNote: "الاشتراكات الملغاة تُحسب منفصلة عن المنتهية.",
  activityTitle: "النشاط الأخير",
  activityDescription: "أحدث الإجراءات الإدارية عبر المنصة.",
  activityEmpty: "لم تُسجَّل إجراءات إدارية.",
  activityFailed: "تعذر تحميل سجل النشاط.",
  recorded: "مُسجَّل",
  administrator: "مسؤول",
  you: "أنت",
  attentionTitle: "يحتاج إلى انتباه",
  attentionDescription: "عناصر تتطلب مراجعتك أو إجراءً.",
  attentionEmpty: "لا يوجد ما يحتاج إلى انتباه الآن.",
  attentionFailedEmails: "رسائل فاشلة",
  attentionFailedEmailsDetail: "فشل إرسال {count} من الرسائل.",
  attentionPending: "مراجعات اشتراك معلّقة",
  attentionPendingDetail: "{count} اشتراكات بانتظار التفعيل.",
  attentionExpired: "اشتراكات منتهية",
  attentionExpiredDetail: "انتهى {count} من الاشتراكات.",
  attentionDomains: "نطاقات تحتاج إلى تحقق",
  attentionDomainsDetail: "{count} نطاقات خاصة بانتظار تحقق DNS.",
  attentionPayments: "دفعات فاشلة",
  attentionPaymentsDetail: "فشلت {count} من الدفعات.",
  attentionPastDue: "اشتراكات متأخرة",
  attentionPastDueDetail: "{count} اشتراكات متأخرة السداد.",
  revenue: "الإيراد",
  revenueDetail: "إجمالي الدفعات المكتملة في هذا النطاق.",
  revenueMixed: "تستخدم الدفعات المكتملة أكثر من عملة، لذلك تُعرض كل عملة على حدة.",
  revenueNone: "لا توجد دفعات مكتملة في هذا النطاق.",
  revenueUnavailable: "تعذر جمع إيراد هذا النطاق.",
  activeBusinesses: "الأعمال النشطة",
  columnDate: "التاريخ",
  columnAdministrator: "المسؤول",
  columnStatus: "الحالة",
  auditActions: {
    plan_created: "أُنشئت خطة",
    plan_updated: "حُدّثت خطة",
    subscription_activate: "فُعّل اشتراك",
    subscription_renew: "جُدّد اشتراك",
    subscription_expire: "انتهى اشتراك",
    subscription_cancel: "أُلغي اشتراك",
    business_suspended: "أُوقف عمل",
    business_reactivated: "أُعيد تفعيل عمل",
    payment_refund: "استُردت دفعة",
    plan_granted: "مُنحت خطة",
  },
  upgradePlan: "ترقية الخطة",
  upgradeNote: "يفعّل هذا الإجراء الخطة المختارة لشهر واحد ولا ينشئ دفعة.",
  noBusiness: "لا يوجد عمل",
  noPlan: "لا توجد خطة نشطة",
  noUpgrade: "لا توجد خطة أعلى.",
  selectUser: "اختر مستخدمًا لعرض بياناته وتحديث خطته.",
  search: "بحث",
  status: "الحالة",
  all: "الكل",
  apply: "تطبيق",
  previous: "السابق",
  next: "التالي",
  empty: "لا يوجد ما يطابق هذا العرض.",
  page: "صفحة",
  reason: "السبب",
  confirm: "أؤكد هذا التغيير",
  recordId: "معرّف السجل",
  applyChange: "حفظ التغيير",
  planCode: "رمز الخطة",
  details: "الوصف",
  queued: "في الانتظار",
  sent: "مُرسلة",
  failed: "فاشلة",
  emailsDescription: "عرض رسائل النظام المرسلة إلى المستخدمين وتتبعها.",
  emailsSearch: "البحث بالبريد",
  copyMessage: "نسخ رسالة المزوّد",
  save: "حفظ الخطة",
  create: "إنشاء خطة",
  suspend: "إيقاف",
  reactivate: "إعادة التفعيل",
  operation: "تعديل",
  activate: "تفعيل الطلب",
  renew: "تجديد شهر واحد",
  expire: "تعليمها منتهية",
  cancel: "الإلغاء إلى المجانية",
  refund: "استرداد الدفعة",
  appointed: "مسؤول",
  member: "عضو",
  paymentNote: "تُسجَّل الدفعات المكتملة فقط بعد تحقق PayPal من القبض. لا يمكن لهذه الشاشة إنشاء دفعة ناجحة.",
  paymentsSearch: "البحث برقم الطلب أو مرجع القبض أو مرجع الاسترداد",
  paymentsIdPlaceholder: "أدخل معرّف دفعة PayPal",
  paymentsReasonPlaceholder: "أدخل سبب الاسترداد",
  paymentsCopy: "نسخ المرجع",
  appointmentNote: "يأتي وصول المسؤول من قائمة مسؤولي المنصة. تغيير الاسم أو علامة الملف الشخصي لا يعيّن أحدًا.",
  adjustmentNote: "يتطلب التعديل اليدوي سببًا. يُحفظ المشغّل والوقت بتوقيت UTC والقيم قبل التغيير وبعده. لا ينشئ هذا التعديل دفعة.",
  analyticsNote: "أعداد مشاهدات القائمة والمنتجات العامة. لا تُعرض معرّفات الزوار.",
  auditTitle: "أحدث التغييرات الإدارية",
  metrics: {
    businesses: "الأعمال",
    suspended: "الموقوفة",
    users: "المستخدمون",
    activeSubscriptions: "الاشتراكات النشطة",
    pendingSubscriptions: "الاشتراكات المعلقة",
    expiredSubscriptions: "الاشتراكات المنتهية",
    completedPayments: "الدفعات المكتملة",
    failedEmails: "رسائل البريد الفاشلة",
    domains: "النطاقات الخاصة",
    menuViews7d: "مشاهدات القائمة خلال 7 أيام",
  },
  columns: {
    business: "العمل",
    owner: "المالك",
    user: "الاسم",
    email: "البريد",
    plan: "الخطة",
    amount: "المبلغ",
    reference: "مرجع القبض",
    order: "طلب PayPal",
    refundReference: "مرجع الاسترداد",
    domain: "النطاق",
    template: "القالب",
    provider: "رسالة المزوّد",
    when: "الوقت",
    action: "الإجراء",
  },
  businessStatuses: {
    draft: "مسودة",
    active: "نشط",
    archived: "مؤرشف",
    suspended: "موقوف",
  },
  analyticsLabels: {
    menu7: "مشاهدات القائمة خلال 7 أيام",
    product7: "مشاهدات المنتجات خلال 7 أيام",
    menu30: "مشاهدات القائمة خلال 30 يومًا",
    product30: "مشاهدات المنتجات خلال 30 يومًا",
  },
  analyticsPage: {
    description: "راجع الدفعات المحصّلة والمستردة وإيراد كل خطة.",
    note: "هذه المبالغ دفعات PayPal المكتملة. لا يسجّل مينور تكاليف التشغيل، لذلك هذا ليس ربحًا بعد المصاريف.",
    days7: "آخر 7 أيام",
    days30: "آخر 30 يومًا",
    days90: "آخر 90 يومًا",
    from: "من",
    to: "إلى",
    apply: "تطبيق",
    collected: "المحصّل",
    collectedHint: "الدفعات المكتملة في هذه الفترة.",
    refunds: "المسترد",
    refundsHint: "الدفعات التي استُردت في هذه الفترة.",
    net: "الصافي المحصّل",
    netHint: "المحصّل ناقص المسترد، وكل عملة على حدة.",
    failed: "الدفعات الفاشلة",
    failedHint: "الدفعات التي فشلت في هذه الفترة.",
    none: "لا شيء في هذه الفترة",
    unavailable: "تعذر جمع هذه الفترة.",
    vsPrevious: "مقارنة بالأيام الـ {count} السابقة",
    chartTitle: "الإيراد المحصّل",
    chartHint: "الدفعات المكتملة حسب اليوم. تبقى كل عملة منفصلة.",
    chartEmpty: "لا توجد دفعات مكتملة في هذه الفترة.",
    plansTitle: "الإيراد حسب الخطة",
    plansEmpty: "لا توجد دفعات مكتملة في هذه الفترة.",
    unassignedPlan: "الخطة غير مسجّلة",
    payments: "دفعات",
    outcomes: "نتائج الدفع",
    pending: "قيد الانتظار",
    completed: "مكتملة",
    refunded: "مستردة",
    openPayments: "فتح الدفعات",
    dailyTitle: "التحصيل اليومي",
    dailyHint: "الدفعات المكتملة والمستردة لكل يوم.",
    date: "التاريخ",
    currency: "العملة",
    exportCsv: "تصدير CSV",
  },
  plansPage: {
    description: "أدر الأسعار والحدود وظهور خطط الاشتراك.",
    activePlans: "الخطط النشطة",
    activePlansHint: "الخطط الظاهرة في قائمة الأسعار",
    subscribers: "المشتركون",
    subscribersHint: "اشتراكات نشطة وما زالت ضمن مدتها",
    mrr: "الإيراد الشهري المتكرر",
    mrrHint: "مجموع أسعار الخطط الحالية",
    mrrUnavailable: "هذا المجموع غير مكتمل، لذلك أُخفي.",
    mrrNone: "لا توجد اشتراكات حالية",
    allPlans: "كل الخطط",
    active: "نشطة",
    draft: "مسودة",
    searchPlaceholder: "البحث في الخطط...",
    allCurrencies: "كل العملات",
    columnPlan: "الخطة",
    columnPrice: "السعر",
    columnBusinesses: "الأعمال",
    columnProducts: "المنتجات",
    columnLayouts: "التخطيطات",
    columnAnalytics: "التحليلات",
    columnDomains: "النطاق الخاص",
    columnStatus: "الحالة",
    columnActions: "إجراءات",
    edit: "تعديل",
    more: "المزيد",
    activate: "تفعيل",
    deactivate: "إيقاف الظهور",
    included: "مشمول",
    notIncluded: "لا",
    days: "{count} يوم",
    perMonth: "/ شهر",
    empty: "لا توجد خطط مطابقة.",
    unavailable: "غير متاح",
    createTitle: "إنشاء خطة جديدة",
    createHint: "أضف خطة اشتراك جديدة إلى المنصة.",
    editTitle: "تعديل الخطة",
    editHint: "يحدّث هذا الخطة. لا ينشئ دفعة ولا يغيّر مدة اشتراك قائمة.",
    basic: "البيانات الأساسية",
    pricing: "السعر وحدود الاستخدام",
    features: "الميزات والظهور",
    code: "رمز الخطة",
    codePlaceholder: "مثال: starter",
    name: "الاسم الظاهر",
    namePlaceholder: "مثال: Starter",
    planDescription: "الوصف",
    planDescriptionPlaceholder: "وصف مختصر لهذه الخطة",
    price: "السعر بالوحدة الصغرى",
    currency: "العملة",
    interval: "دورة الفوترة",
    monthly: "شهري",
    intervalNote: "كل الخطط تُفوتر شهريًا. لا يمكن تغيير ذلك.",
    businessLimit: "حد الأعمال",
    productLimit: "حد المنتجات",
    layoutLimit: "حد التخطيطات",
    retention: "الاحتفاظ بالتحليلات (أيام)",
    catalog: "ظاهرة في قائمة الأسعار",
    catalogHint: "أظهر هذه الخطة في صفحة الأسعار العامة.",
    domains: "النطاقات الخاصة",
    domainsHint: "اسمح باستخدام نطاق خاص للأعمال على هذه الخطة.",
    reason: "سبب التغيير",
    reasonPlaceholder: "مثال: إضافة خطة جديدة للمطاعم الصغيرة",
    reasonHint: "مطلوب. من 8 إلى 500 حرفًا. يُحفظ في سجل المراجعة.",
    cancel: "إلغاء",
    save: "حفظ التغييرات",
    confirmTitle: "تأكيد هذا التغيير",
    confirmBody: "يحدّث هذا الخطة ويكتب سجل مراجعة. لا ينشئ دفعة.",
    confirm: "تأكيد",
  },
  subscriptionsPage: {
    description: "كل صف حساب واحد. الخطة تغطي كل الأعمال التي يملكها هذا الحساب.",
    total: "كل الاشتراكات",
    totalHint: "كل الفترات",
    active: "نشطة",
    activeHint: "النشطة الآن",
    expiring: "تنتهي قريبًا",
    expiringHint: "خلال 30 يومًا",
    expired: "منتهية",
    expiredHint: "انتهت بالفعل",
    unavailable: "غير متاح",
    searchPlaceholder: "ابحث باسم الحساب أو البريد أو الخطة أو معرّف السجل...",
    recordId: "معرّف السجل",
    account: "الحساب",
    businessCount: "{count} أعمال",
    plan: "الخطة",
    expiration: "الانتهاء",
    createdAt: "تاريخ الإنشاء",
    actions: "إجراءات",
    manage: "إدارة",
    copyId: "نسخ معرّف السجل",
    copied: "تم النسخ",
    noExpiration: "بلا تاريخ انتهاء",
    showing: "عرض {from} إلى {to} من {total}",
    perPage: "{count} / الصفحة",
    updateTitle: "تحديث الاشتراك",
    updateHint: "أجرِ تغييرًا يدويًا على الاشتراك. السبب مطلوب وسيُسجَّل التغيير.",
    idPlaceholder: "اختر اشتراكًا من الجدول أو أدخل معرّف السجل",
    selected: "{account} · {plan} · {status}",
    reasonPlaceholder: "اكتب سبب هذا التغيير...",
    reasonHint: "مطلوب. من 8 إلى 500 حرفًا. يُحفظ مع المسؤول والوقت بتوقيت UTC.",
    confirmTitle: "تطبيق هذا التغيير؟",
    confirmBody: "يحدّث هذا الاشتراك ويكتب سجل مراجعة. لا ينشئ دفعة.",
    confirm: "حفظ التغيير",
    clear: "مسح",
  },
  messages: {
    saved: "تم حفظ الخطة.",
    created: "تم إنشاء الخطة.",
    forbidden: "هذا الإجراء مقصور على مسؤولي المنصة.",
    invalid: "راجع القيم والتأكيد ثم أعد المحاولة.",
    failed: "لم يُحفظ التغيير.",
    suspended: "تم إيقاف العمل وإزالته من القائمة العامة.",
    reactivated: "أُزيل الإيقاف. انشر القائمة مرة أخرى عندما تريدها عامة.",
    adjusted: "تم تحديث الاشتراك.",
    refunded: "تم تسجيل استرداد PayPal المتحقق منه.",
    audit_failed: "اكتمل الاسترداد، ولم يُحفظ سجل المراجعة.",
    unconfigured: "الدفعات غير مُعدّة في هذه البيئة.",
    not_found: "لم يُعثر على هذا السجل.",
    granted: "أصبحت الخطة نشطة لشهر واحد. لم تُسجَّل أي دفعة.",
    reason_short: "أدخل سببًا من 8 أحرف على الأقل.",
  },
};
