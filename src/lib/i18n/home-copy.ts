import type { Locale } from "@/lib/i18n/locales";

export type HomeChrome = {
  perMonth: string;
  locations: string;
  products: string;
  layouts: string;
  customDomain: string;
  analytics: string;
  getStarted: string;
  choosePlan: string;
  sampleMenu: string;
  sampleItems: [string, string, string];
  scanMenu: string;
  noPlans: string;
  languageLabel: string;
};

const english: HomeChrome = {
  perMonth: "/ month",
  locations: "{count} locations",
  products: "{count} products",
  layouts: "{count} layouts",
  customDomain: "Custom domain",
  analytics: "{count} days of analytics",
  getStarted: "Get started",
  choosePlan: "Choose plan",
  sampleMenu: "Sample menu",
  sampleItems: ["House special", "Seasonal plate", "Fresh juice"],
  scanMenu: "Scan to view menu",
  noPlans: "Active plans will appear here.",
  languageLabel: "Language",
};

const arabic: HomeChrome = {
  perMonth: "/ شهر",
  locations: "{count} فروع",
  products: "{count} صنف",
  layouts: "{count} تخطيطات",
  customDomain: "نطاق خاص",
  analytics: "{count} يوم تحليلات",
  getStarted: "ابدأ الآن",
  choosePlan: "اختر الخطة",
  sampleMenu: "قائمة تجريبية",
  sampleItems: ["طبق اليوم", "طبق موسمي", "عصير طازج"],
  scanMenu: "امسح لمشاهدة القائمة",
  noPlans: "ستظهر الخطط النشطة هنا.",
  languageLabel: "اللغة",
};

export function homeChrome(locale: Locale): HomeChrome {
  return locale === "ar" ? arabic : english;
}
