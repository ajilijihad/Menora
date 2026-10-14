import type {
  CardLayout,
  FeaturedStyle,
  FontChoice,
  ImageRatio,
  NavStyle,
  SpacingStep,
  TypeScale,
} from "@/lib/menus/appearance";
import type { MenuTheme } from "@/lib/menus/public-menu";

export type AppearanceCopy = {
  title: string;
  description: string;
  preview: string;
  desktop: string;
  mobile: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  font: string;
  typeScale: string;
  cardLayout: string;
  imageRatio: string;
  radius: string;
  spacing: string;
  navStyle: string;
  featuredStyle: string;
  logo: string;
  cover: string;
  removeLogo: string;
  removeCover: string;
  save: string;
  saving: string;
  cancel: string;
  reset: string;
  restore: string;
  saved: string;
  contrast: string;
  sampleCategory: string;
  sampleDish: string;
  sampleNote: string;
  readOnly: string;
  discardTitle: string;
  discardDescription: string;
  discardConfirm: string;
  stay: string;
  back: string;
  previewTheme: string;
  applyTheme: string;
  selectedTheme: string;
  themes: Record<MenuTheme, string>;
  fonts: Record<FontChoice, string>;
  scales: Record<TypeScale, string>;
  cards: Record<CardLayout, string>;
  ratios: Record<ImageRatio, string>;
  spaces: Record<SpacingStep, string>;
  navs: Record<NavStyle, string>;
  featured: Record<FeaturedStyle, string>;
};

export const appearanceCopyEn: AppearanceCopy = {
  title: "Theme editor",
  description: "Changes appear in the preview immediately. Save to publish them on the public menu.",
  preview: "Live preview",
  desktop: "Desktop",
  mobile: "Mobile",
  primary: "Primary color",
  secondary: "Secondary color",
  background: "Background color",
  text: "Text color",
  font: "Font",
  typeScale: "Type scale",
  cardLayout: "Product card",
  imageRatio: "Image shape",
  radius: "Corner radius",
  spacing: "Spacing",
  navStyle: "Category navigation",
  featuredStyle: "Featured products",
  logo: "Logo",
  cover: "Cover image",
  removeLogo: "Remove logo",
  removeCover: "Remove cover",
  save: "Save theme",
  saving: "Saving",
  cancel: "Cancel",
  reset: "Reset",
  restore: "Restore default",
  saved: "The theme was saved.",
  contrast: "Text and background are below the usual contrast level. You can still save.",
  sampleCategory: "Sample category",
  sampleDish: "Sample dish",
  sampleNote: "These sample dishes are only in the preview. They are not saved.",
  readOnly: "You can preview this theme. Owners and managers can change it.",
  discardTitle: "Leave without saving?",
  discardDescription: "Your theme changes will be discarded.",
  discardConfirm: "Discard changes",
  stay: "Keep editing",
  back: "Back to menu",
  previewTheme: "Preview",
  applyTheme: "Apply",
  selectedTheme: "Selected",
  themes: {
    "modern-dark": "Modern Dark",
    "clean-light": "Clean Light",
    "premium-gold": "Premium Gold",
    "fresh-green": "Fresh Green",
    "traditional-beige": "Traditional Beige",
  },
  fonts: { sans: "Sans", serif: "Serif", mono: "Mono" },
  scales: { sm: "Small", md: "Medium", lg: "Large" },
  cards: { stacked: "Stacked", horizontal: "Horizontal", overlay: "Overlay" },
  ratios: { square: "Square", landscape: "Landscape", portrait: "Portrait" },
  spaces: { compact: "Compact", comfortable: "Comfortable", spacious: "Spacious" },
  navs: { pills: "Pills", underline: "Underline", list: "List" },
  featured: { row: "Row", grid: "Grid", list: "List" },
};

export const appearanceCopyAr: AppearanceCopy = {
  title: "محرر المظهر",
  description: "تظهر التغييرات في المعاينة فورًا. احفظها لتظهر في القائمة العامة.",
  preview: "معاينة مباشرة",
  desktop: "سطح المكتب",
  mobile: "الجوال",
  primary: "اللون الأساسي",
  secondary: "اللون الثانوي",
  background: "لون الخلفية",
  text: "لون النص",
  font: "الخط",
  typeScale: "حجم الخط",
  cardLayout: "بطاقة المنتج",
  imageRatio: "شكل الصورة",
  radius: "استدارة الزوايا",
  spacing: "المسافات",
  navStyle: "تنقل التصنيفات",
  featuredStyle: "المنتجات المميزة",
  logo: "الشعار",
  cover: "صورة الغلاف",
  removeLogo: "إزالة الشعار",
  removeCover: "إزالة الغلاف",
  save: "حفظ المظهر",
  saving: "جار الحفظ",
  cancel: "إلغاء",
  reset: "تراجع",
  restore: "استعادة الافتراضي",
  saved: "تم حفظ المظهر.",
  contrast: "تباين النص والخلفية أقل من المستوى المعتاد. يمكنك الحفظ مع ذلك.",
  sampleCategory: "تصنيف تجريبي",
  sampleDish: "طبق تجريبي",
  sampleNote: "هذه الأطباق التجريبية في المعاينة فقط. لا يتم حفظها.",
  readOnly: "يمكنك معاينة هذا المظهر. المالكون والمديرون هم من يستطيعون تغييره.",
  discardTitle: "المغادرة دون حفظ؟",
  discardDescription: "سيتم تجاهل تغييرات المظهر.",
  discardConfirm: "تجاهل التغييرات",
  stay: "متابعة التحرير",
  back: "العودة إلى القائمة",
  previewTheme: "معاينة",
  applyTheme: "تطبيق",
  selectedTheme: "محدد",
  themes: {
    "modern-dark": "داكن حديث",
    "clean-light": "فاتح نظيف",
    "premium-gold": "ذهبي فاخر",
    "fresh-green": "أخضر منعش",
    "traditional-beige": "بيج تقليدي",
  },
  fonts: { sans: "بلا زخرفة", serif: "بذيل", mono: "ثابت العرض" },
  scales: { sm: "صغير", md: "متوسط", lg: "كبير" },
  cards: { stacked: "متراصة", horizontal: "أفقية", overlay: "متراكبة" },
  ratios: { square: "مربع", landscape: "أفقي", portrait: "عمودي" },
  spaces: { compact: "مضغوط", comfortable: "مريح", spacious: "واسع" },
  navs: { pills: "حبوب", underline: "تسطير", list: "قائمة" },
  featured: { row: "صف", grid: "شبكة", list: "قائمة" },
};
