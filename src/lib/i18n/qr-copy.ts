export type QrCopy = {
  title: string;
  description: string;
  downloadPng: string;
  downloadPngHint: string;
  downloadSvg: string;
  downloadSvgHint: string;
  print: string;
  printHint: string;
  address: string;
  themeNote: string;
  unavailable: string;
  hidden: string;
  publishLink: string;
  logoAlt: string;
  customizeTitle: string;
  customizeDescription: string;
  previewTitle: string;
  previewHint: string;
  copyLink: string;
  copied: string;
  copyFailed: string;
  foreground: string;
  background: string;
  contrastError: string;
  styleLabel: string;
  colorsLabel: string;
  styles: Record<"classic" | "rounded" | "dots" | "logo", string>;
  logoOptional: string;
  logoHint: string;
  removeLogo: string;
  publicReady: string;
  publicReadyHint: string;
  posterTitle: string;
  posterDescription: string;
  posterItems: string[];
  downloadPoster: string;
  posterScan: string;
  posterBackground: string;
  posterUpload: string;
  posterRemoveBackground: string;
  posterSize: string;
  posterSizeLabels: Record<"a5" | "a6" | "a7" | "square" | "letter", string>;
  posterSave: string;
  posterSaving: string;
  posterSaved: string;
  posterPrint: string;
  posterSaveFirst: string;
  posterUnready: string;
  posterFailed: string;
  posterTooLarge: string;
  posterType: string;
  posterRate: string;
  tipsTitle: string;
  tips: { title: string; body: string }[];
};

export const qrCopyEn: QrCopy = {
  title: "Menu QR code",
  description: "Let customers open your digital menu instantly by scanning your QR code.",
  downloadPng: "Download PNG",
  downloadPngHint: "High quality image",
  downloadSvg: "Download SVG",
  downloadSvgHint: "Vector format",
  print: "Print",
  printHint: "Ready for signs",
  address: "Public menu URL",
  themeNote: "Changing the menu theme does not change this code.",
  unavailable: "Set the public site address to an https URL before creating a QR code.",
  hidden: "The public page stays hidden until this business is active and published. The code will open it once it is.",
  publishLink: "Publish menu",
  logoAlt: "Business logo",
  customizeTitle: "Customize your QR code",
  customizeDescription: "Choose a style and colors to match your brand.",
  previewTitle: "Your menu QR code",
  previewHint: "Scan this code to open your digital menu.",
  copyLink: "Copy",
  copied: "Copied",
  copyFailed: "Copy failed",
  foreground: "QR code color",
  background: "Background color",
  contrastError: "Choose a darker code on a lighter background so the code stays easy to scan.",
  styleLabel: "Style",
  colorsLabel: "Colors",
  styles: { classic: "Classic", rounded: "Rounded", dots: "Dots", logo: "With logo" },
  logoOptional: "Logo (optional)",
  logoHint: "Use a square logo for best results.",
  removeLogo: "Remove logo",
  publicReady: "This menu is publicly accessible.",
  publicReadyHint: "Anyone with this QR code can view your menu.",
  posterTitle: "Print-ready QR poster",
  posterDescription: "Download a beautiful poster to display in your restaurant.",
  posterItems: ["Professional design", "Includes your logo", "Perfect for tables and signs", "High resolution (A5 ready)"],
  downloadPoster: "Download poster",
  posterScan: "Scan to view our menu",
  posterBackground: "Background",
  posterUpload: "Upload background",
  posterRemoveBackground: "Remove background",
  posterSize: "Poster size",
  posterSizeLabels: { a5: "A5", a6: "A6", a7: "A7", square: "Square", letter: "Letter" },
  posterSave: "Save poster",
  posterSaving: "Saving...",
  posterSaved: "Poster saved. You can print it or download it.",
  posterPrint: "Print poster",
  posterSaveFirst: "Save the poster before printing or downloading.",
  posterUnready: "Poster saving needs the latest database update before it can store a background.",
  posterFailed: "The poster could not be saved. Try again.",
  posterTooLarge: "Use a background image under 1.5 MB.",
  posterType: "Use a JPEG, PNG, or WebP image.",
  posterRate: "Too many saves. Wait a moment and try again.",
  tipsTitle: "Tips for best results",
  tips: [
    { title: "Place in visible locations", body: "Put the QR code on tables, walls, or at the entrance." },
    { title: "Keep it clean", body: "Make sure the QR code is not damaged or covered." },
    { title: "Test the QR code", body: "Scan it with different phones to ensure it works." },
    { title: "Use your brand colors", body: "Customize the QR code to match your restaurant's style." },
  ],
};

export const qrCopyAr: QrCopy = {
  title: "رمز QR للقائمة",
  description: "اسمح للزبائن بفتح قائمتك الرقمية فورًا عبر مسح رمز QR.",
  downloadPng: "تنزيل PNG",
  downloadPngHint: "صورة عالية الجودة",
  downloadSvg: "تنزيل SVG",
  downloadSvgHint: "صيغة متجهة",
  print: "طباعة",
  printHint: "جاهز للافتات",
  address: "رابط القائمة العامة",
  themeNote: "تغيير مظهر القائمة لا يغيّر هذا الرمز.",
  unavailable: "اضبط عنوان الموقع العام على رابط https قبل إنشاء رمز QR.",
  hidden: "تبقى الصفحة العامة مخفية إلى أن يصبح هذا العمل نشطًا ومنشورًا. سيفتح الرمز الصفحة بعد ذلك.",
  publishLink: "نشر القائمة",
  logoAlt: "شعار العمل",
  customizeTitle: "خصّص رمز QR",
  customizeDescription: "اختر نمطًا وألوانًا تناسب علامتك.",
  previewTitle: "رمز QR لقائمتك",
  previewHint: "امسح هذا الرمز لفتح قائمتك الرقمية.",
  copyLink: "نسخ",
  copied: "تم النسخ",
  copyFailed: "تعذّر النسخ",
  foreground: "لون الرمز",
  background: "لون الخلفية",
  contrastError: "اختر رمزًا داكنًا على خلفية فاتحة ليبقى المسح سهلًا.",
  styleLabel: "النمط",
  colorsLabel: "الألوان",
  styles: { classic: "كلاسيكي", rounded: "مستدير", dots: "نقاط", logo: "مع الشعار" },
  logoOptional: "الشعار (اختياري)",
  logoHint: "استخدم شعارًا مربعًا للحصول على أفضل نتيجة.",
  removeLogo: "إزالة الشعار",
  publicReady: "هذه القائمة متاحة للعموم.",
  publicReadyHint: "أي شخص يملك هذا الرمز يمكنه مشاهدة قائمتك.",
  posterTitle: "ملصق QR جاهز للطباعة",
  posterDescription: "نزّل ملصقًا جميلًا لعرضه في مطعمك.",
  posterItems: ["تصميم احترافي", "يتضمن شعارك", "مناسب للطاولات واللافتات", "دقة عالية (جاهز لـ A5)"],
  downloadPoster: "تنزيل الملصق",
  posterScan: "امسح لعرض قائمتنا",
  posterBackground: "الخلفية",
  posterUpload: "رفع خلفية",
  posterRemoveBackground: "إزالة الخلفية",
  posterSize: "مقاس الملصق",
  posterSizeLabels: { a5: "A5", a6: "A6", a7: "A7", square: "مربع", letter: "Letter" },
  posterSave: "حفظ الملصق",
  posterSaving: "جارٍ الحفظ...",
  posterSaved: "تم حفظ الملصق. يمكنك طباعته أو تنزيله.",
  posterPrint: "طباعة الملصق",
  posterSaveFirst: "احفظ الملصق قبل الطباعة أو التنزيل.",
  posterUnready: "حفظ الملصق يحتاج تحديث قاعدة البيانات الأخير قبل تخزين الخلفية.",
  posterFailed: "تعذّر حفظ الملصق. حاول مرة أخرى.",
  posterTooLarge: "استخدم صورة خلفية أصغر من 1.5 ميغابايت.",
  posterType: "استخدم صورة JPEG أو PNG أو WebP.",
  posterRate: "محاولات حفظ كثيرة. انتظر قليلًا ثم حاول مرة أخرى.",
  tipsTitle: "نصائح لنتيجة أفضل",
  tips: [
    { title: "ضعه في مكان ظاهر", body: "ضع رمز QR على الطاولات أو الجدران أو عند المدخل." },
    { title: "أبقِه نظيفًا", body: "تأكد أن رمز QR غير تالف وغير مغطى." },
    { title: "جرّب رمز QR", body: "امسحه بهواتف مختلفة للتأكد من أنه يعمل." },
    { title: "استخدم ألوان علامتك", body: "خصّص رمز QR ليناسب أسلوب مطعمك." },
  ],
};
