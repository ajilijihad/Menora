import type { MessageCode } from "@/lib/auth/messages";

import { appearanceCopyAr, appearanceCopyEn, type AppearanceCopy } from "./appearance-copy";
import { businessCopyAr, businessCopyEn, type BusinessCopy } from "./business-copy";
import { menuCopyAr, menuCopyEn, type MenuCopy } from "./menu-copy";
import { publicMenuCopyAr, publicMenuCopyEn, type PublicMenuCopy } from "./public-menu-copy";
import { adminCopyAr, adminCopyEn, type AdminCopy } from "./admin-copy";
import { billingCopyAr, billingCopyEn, type BillingCopy } from "./billing-copy";
import { dashboardCopyAr, dashboardCopyEn, type DashboardCopy } from "./dashboard-copy";
import { insightsCopyAr, insightsCopyEn, type InsightsCopy } from "./insights-copy";
import { qrCopyAr, qrCopyEn, type QrCopy } from "./qr-copy";
import type { Locale } from "./locales";

export type Dictionary = {
  brand: string;
  language: { switchTo: string };
  nav: {
    login: string;
    register: string;
    dashboard: string;
    profile: string;
    logout: string;
    admin: string;
  };
  home: {
    title: string;
    description: string;
  };
  auth: {
    loginTitle: string;
    loginDescription: string;
    registerTitle: string;
    registerDescription: string;
    registerPanelTitle: string;
    fullName: string;
    namePlaceholder: string;
    createPasswordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    newPasswordPlaceholder: string;
    confirmNewPasswordPlaceholder: string;
    securityNote: string;
    ruleLength: string;
    ruleLetter: string;
    ruleNumber: string;
    ruleUncommon: string;
    forgotTitle: string;
    forgotDescription: string;
    resetTitle: string;
    resetDescription: string;
    verifyTitle: string;
    verifyDescription: string;
    profileDescription: string;
    emailStatus: string;
    verified: string;
    unverified: string;
    changePicture: string;
    removePicture: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    passwordHint: string;
    submitLogin: string;
    submitRegister: string;
    submitForgot: string;
    submitReset: string;
    submitProfile: string;
    submitResend: string;
    pending: string;
    forgotLink: string;
    recoverTitle: string;
    recoverBody: string;
    forgotHeading: string;
    forgotLead: string;
    checkEmailTitle: string;
    checkEmailBody: string;
    inboxTitle: string;
    resendEmail: string;
    resendWait: string;
    welcomeTitle: string;
    welcomeBody: string;
    featureMenu: string;
    featureMenuBody: string;
    featureCustomers: string;
    featureCustomersBody: string;
    featureGrow: string;
    featureGrowBody: string;
    loginHeading: string;
    loginSubtitle: string;
    emailAddress: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    rememberMe: string;
    showPassword: string;
    hidePassword: string;
    language: string;
    mealAlt: string;
    noAccount: string;
    hasAccount: string;
    backToLogin: string;
    resendDescription: string;
  };
  messages: Record<MessageCode, string>;
  dashboard: DashboardCopy;
  admin: AdminCopy;
  states: {
    loading: string;
    notFoundTitle: string;
    notFoundDescription: string;
    backHome: string;
    errorTitle: string;
    errorDescription: string;
    retry: string;
  };
  business: BusinessCopy;
  menu: MenuCopy;
  publicMenu: PublicMenuCopy;
  appearance: AppearanceCopy;
  qr: QrCopy;
  billing: BillingCopy;
  insights: InsightsCopy;
  calendar: {
    clear: string;
    today: string;
    previousMonth: string;
    nextMonth: string;
    chooseMonth: string;
  };
};

const en = {
  brand: "Menor",
  language: { switchTo: "العربية" },
  nav: {
    login: "Log in",
    register: "Create account",
    dashboard: "Dashboard",
    profile: "Profile",
    logout: "Log out",
    admin: "Admin",
  },
  home: {
    title: "Digital menus for every location.",
    description:
      "Menor hosts digital menus for restaurants and multi-location businesses. Public menus stay open without an account.",
  },
  auth: {
    loginTitle: "Log in",
    loginDescription: "Use the email and password for your Menor account.",
    registerTitle: "Create your account",
    registerDescription: "Enter your name, email, and a password. We will email you a confirmation link.",
    registerPanelTitle: "Create your account to get started",
    fullName: "Full name",
    namePlaceholder: "Enter your full name",
    createPasswordPlaceholder: "Create a password",
    confirmPasswordPlaceholder: "Confirm your password",
    newPasswordPlaceholder: "Enter your new password",
    confirmNewPasswordPlaceholder: "Confirm your new password",
    securityNote: "Your account security matters.",
    ruleLength: "At least 8 characters",
    ruleLetter: "At least one letter",
    ruleNumber: "At least one number",
    ruleUncommon: "No common passwords",
    forgotTitle: "Reset your password",
    forgotDescription: "Enter your email and we will send a reset link if an account exists.",
    resetTitle: "Choose a new password",
    resetDescription: "This link opened a recovery session. Set a new password to continue.",
    verifyTitle: "Check your email",
    verifyDescription: "Open the confirmation link to activate your account, then log in.",
    profileDescription: "Update the name on your account. Your email stays tied to sign-in and cannot be changed here.",
    emailStatus: "Email status",
    verified: "Verified",
    unverified: "Unverified",
    changePicture: "Change picture",
    removePicture: "Remove picture",
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    passwordHint: "Use at least 8 characters, including a letter and a number.",
    submitLogin: "Log in",
    submitRegister: "Create account",
    submitForgot: "Send reset link",
    submitReset: "Update password",
    submitProfile: "Save name",
    submitResend: "Resend confirmation",
    pending: "Please wait",
    forgotLink: "Forgot password?",
    recoverTitle: "Get back to your account",
    recoverBody: "Reset your password and continue managing your menu with Menor.",
    forgotHeading: "Forgot your password?",
    forgotLead: "No worries, we'll send you a password reset link to your email address.",
    checkEmailTitle: "Check your email",
    checkEmailBody: "We'll send you a link to reset your password. If you don't see the email, check your spam folder.",
    inboxTitle: "Check your inbox",
    resendEmail: "Resend email",
    resendWait: "Resend email in {seconds}s",
    welcomeTitle: "Welcome back!",
    welcomeBody: "Manage your menu, attract more customers, and grow your business with Menor.",
    featureMenu: "Easy menu management",
    featureMenuBody: "Update your menu, prices, and photos anytime.",
    featureCustomers: "Attract more customers",
    featureCustomersBody: "Get a beautiful online menu with QR code.",
    featureGrow: "Grow your business",
    featureGrowBody: "Powerful tools to help you succeed.",
    loginHeading: "Log in to your account",
    loginSubtitle: "Welcome back! Please enter your details to continue.",
    emailAddress: "Email address",
    emailPlaceholder: "Enter your email address",
    passwordPlaceholder: "Enter your password",
    rememberMe: "Remember me",
    showPassword: "Show password",
    hidePassword: "Hide password",
    language: "Language",
    mealAlt: "Grilled chicken salad on a restaurant plate",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    backToLogin: "Back to log in",
    resendDescription: "Didn't get the message? Send it again.",
  },
  messages: {
    name_required: "Enter your name.",
    name_too_long: "Use a shorter name.",
    email_invalid: "Enter a valid email address.",
    password_short: "Use at least 8 characters.",
    password_long: "Use a password of 72 characters or fewer.",
    password_weak: "Include both a letter and a number.",
    password_common: "Choose a less common password.",
    password_mismatch: "Those passwords do not match.",
    invalid_credentials: "That email and password do not match.",
    email_unconfirmed: "Confirm your email before logging in.",
    email_taken: "An account with this email already exists. Try logging in.",
    rate_limited: "Too many attempts. Wait a few minutes and try again.",
    unconfigured: "Sign-in is not configured in this environment yet.",
    auth_failed: "We could not complete that request. Try again.",
    profile_failed: "We could not save your profile.",
    profile_missing: "Your profile is not available yet.",
    profile_saved: "Your profile was saved.",
    image_type: "Use a JPEG, PNG, or WebP image.",
    image_too_large: "Use an image of 1.5 MB or less.",
    image_failed: "We could not save that picture.",
    verify_failed: "That confirmation link is invalid or has expired.",
    session_expired: "This reset link has expired. Request a new one.",
    password_updated: "Your password was updated.",
    reset_sent: "If an account exists for this email address, you'll receive a password reset link shortly.",
    check_email: "We sent a confirmation message. Open the link to finish creating your account.",
  },
  dashboard: dashboardCopyEn,
  admin: adminCopyEn,
  states: {
    loading: "Loading",
    notFoundTitle: "Page not found",
    notFoundDescription: "This address does not match a page in Menor.",
    backHome: "Back to home",
    errorTitle: "Something went wrong",
    errorDescription: "This page could not be loaded. Try again.",
    retry: "Try again",
  },
  business: businessCopyEn,
  menu: menuCopyEn,
  publicMenu: publicMenuCopyEn,
  appearance: appearanceCopyEn,
  qr: qrCopyEn,
  billing: billingCopyEn,
  insights: insightsCopyEn,
  calendar: {
    clear: "Clear",
    today: "Today",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    chooseMonth: "Choose month",
  },
} satisfies Dictionary;

const ar = {
  brand: "مينور",
  language: { switchTo: "English" },
  nav: {
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    dashboard: "لوحة التحكم",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    admin: "الإدارة",
  },
  home: {
    title: "قوائم رقمية لكل فرع.",
    description:
      "تستضيف مينور القوائم الرقمية للمطاعم والأعمال متعددة الفروع. تبقى القوائم العامة متاحة بدون حساب.",
  },
  auth: {
    loginTitle: "تسجيل الدخول",
    loginDescription: "استخدم البريد الإلكتروني وكلمة المرور لحسابك في مينور.",
    registerTitle: "أنشئ حسابك",
    registerDescription: "أدخل اسمك وبريدك وكلمة المرور. سنرسل إليك رابط تأكيد.",
    registerPanelTitle: "أنشئ حسابك للبدء",
    fullName: "الاسم الكامل",
    namePlaceholder: "أدخل اسمك الكامل",
    createPasswordPlaceholder: "أنشئ كلمة مرور",
    confirmPasswordPlaceholder: "أكد كلمة المرور",
    newPasswordPlaceholder: "أدخل كلمة المرور الجديدة",
    confirmNewPasswordPlaceholder: "أكد كلمة المرور الجديدة",
    securityNote: "أمان حسابك مهم.",
    ruleLength: "8 أحرف على الأقل",
    ruleLetter: "حرف واحد على الأقل",
    ruleNumber: "رقم واحد على الأقل",
    ruleUncommon: "ليست كلمة مرور شائعة",
    forgotTitle: "إعادة تعيين كلمة المرور",
    forgotDescription: "أدخل بريدك وسنرسل رابط إعادة التعيين إذا كان الحساب موجودًا.",
    resetTitle: "اختر كلمة مرور جديدة",
    resetDescription: "فتح هذا الرابط جلسة استعادة. عيّن كلمة مرور جديدة للمتابعة.",
    verifyTitle: "تحقق من بريدك",
    verifyDescription: "افتح رابط التأكيد لتفعيل الحساب، ثم سجّل الدخول.",
    profileDescription: "حدّث الاسم في حسابك. يبقى البريد مرتبطًا بتسجيل الدخول ولا يمكن تغييره هنا.",
    emailStatus: "حالة البريد",
    verified: "موثّق",
    unverified: "غير موثّق",
    changePicture: "تغيير الصورة",
    removePicture: "إزالة الصورة",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    passwordHint: "استخدم 8 أحرف على الأقل، مع حرف ورقم.",
    submitLogin: "تسجيل الدخول",
    submitRegister: "إنشاء الحساب",
    submitForgot: "إرسال رابط إعادة التعيين",
    submitReset: "تحديث كلمة المرور",
    submitProfile: "حفظ الاسم",
    submitResend: "إعادة إرسال التأكيد",
    pending: "يرجى الانتظار",
    forgotLink: "نسيت كلمة المرور؟",
    recoverTitle: "استعد الوصول إلى حسابك",
    recoverBody: "أعد تعيين كلمة المرور وتابع إدارة قائمتك مع مينور.",
    forgotHeading: "نسيت كلمة المرور؟",
    forgotLead: "لا تقلق، سنرسل رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
    checkEmailTitle: "تحقق من بريدك",
    checkEmailBody: "سنرسل إليك رابطًا لإعادة تعيين كلمة المرور. إذا لم تجد الرسالة، تحقق من مجلد الرسائل غير المرغوب فيها.",
    inboxTitle: "تحقق من صندوق الوارد",
    resendEmail: "إعادة إرسال البريد",
    resendWait: "إعادة الإرسال خلال {seconds} ث",
    welcomeTitle: "مرحبًا بعودتك!",
    welcomeBody: "أدِر قائمتك، واجذب المزيد من الزبائن، وطوّر عملك مع مينور.",
    featureMenu: "إدارة سهلة للقائمة",
    featureMenuBody: "حدّث القائمة والأسعار والصور في أي وقت.",
    featureCustomers: "اجذب المزيد من الزبائن",
    featureCustomersBody: "احصل على قائمة إلكترونية أنيقة مع رمز QR.",
    featureGrow: "طوّر عملك",
    featureGrowBody: "أدوات قوية تساعدك على النجاح.",
    loginHeading: "سجّل الدخول إلى حسابك",
    loginSubtitle: "مرحبًا بعودتك! أدخل بياناتك للمتابعة.",
    emailAddress: "البريد الإلكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    passwordPlaceholder: "أدخل كلمة المرور",
    rememberMe: "تذكرني",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    language: "اللغة",
    mealAlt: "طبق سلطة دجاج مشوي",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    backToLogin: "العودة لتسجيل الدخول",
    resendDescription: "لم تصلك الرسالة؟ أعد إرسالها.",
  },
  messages: {
    name_required: "أدخل اسمك.",
    name_too_long: "استخدم اسمًا أقصر.",
    email_invalid: "أدخل بريدًا إلكترونيًا صالحًا.",
    password_short: "استخدم 8 أحرف على الأقل.",
    password_long: "استخدم كلمة مرور من 72 حرفًا أو أقل.",
    password_weak: "أضف حرفًا ورقمًا.",
    password_common: "اختر كلمة مرور أقل شيوعًا.",
    password_mismatch: "كلمتا المرور غير متطابقتين.",
    invalid_credentials: "البريد أو كلمة المرور غير صحيحة.",
    email_unconfirmed: "أكّد بريدك الإلكتروني قبل تسجيل الدخول.",
    email_taken: "يوجد حساب بهذا البريد. جرّب تسجيل الدخول.",
    rate_limited: "محاولات كثيرة. انتظر بضع دقائق ثم أعد المحاولة.",
    unconfigured: "تسجيل الدخول غير مُعد في هذه البيئة بعد.",
    auth_failed: "تعذر إكمال الطلب. حاول مرة أخرى.",
    profile_failed: "تعذر حفظ الملف الشخصي.",
    profile_missing: "الملف الشخصي غير متاح بعد.",
    profile_saved: "تم حفظ الملف الشخصي.",
    image_type: "استخدم صورة JPEG أو PNG أو WebP.",
    image_too_large: "استخدم صورة بحجم 1.5 ميغابايت أو أقل.",
    image_failed: "تعذر حفظ الصورة.",
    verify_failed: "رابط التأكيد غير صالح أو انتهت صلاحيته.",
    session_expired: "انتهت صلاحية رابط إعادة التعيين. اطلب رابطًا جديدًا.",
    password_updated: "تم تحديث كلمة المرور.",
    reset_sent: "إذا كان هناك حساب لهذا البريد، فسيصلك رابط إعادة تعيين كلمة المرور قريبًا.",
    check_email: "أرسلنا رسالة تأكيد. افتح الرابط لإكمال إنشاء الحساب.",
  },
  dashboard: dashboardCopyAr,
  admin: adminCopyAr,
  states: {
    loading: "جار التحميل",
    notFoundTitle: "الصفحة غير موجودة",
    notFoundDescription: "هذا العنوان لا يطابق صفحة في مينور.",
    backHome: "العودة إلى الرئيسية",
    errorTitle: "حدث خطأ",
    errorDescription: "تعذر تحميل هذه الصفحة. حاول مرة أخرى.",
    retry: "حاول مرة أخرى",
  },
  business: businessCopyAr,
  menu: menuCopyAr,
  publicMenu: publicMenuCopyAr,
  appearance: appearanceCopyAr,
  qr: qrCopyAr,
  billing: billingCopyAr,
  insights: insightsCopyAr,
  calendar: {
    clear: "مسح",
    today: "اليوم",
    previousMonth: "الشهر السابق",
    nextMonth: "الشهر التالي",
    chooseMonth: "اختيار الشهر",
  },
} satisfies Dictionary;

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
