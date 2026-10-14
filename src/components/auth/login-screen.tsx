import { BarChart3, Settings, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand-lockup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

import { LanguageSelect } from "./language-select";

type LoginScreenProps = {
  locale: Locale;
  copy: Dictionary;
  brand: string;
  logoUrl: string | null;
  englishHref: string;
  arabicHref: string;
  panelTitle?: string;
  panelBody?: string;
  introTitle?: string;
  introBody?: string;
  showIntro?: boolean;
  formFirst?: boolean;
  wide?: boolean;
  children: ReactNode;
};

const features = [
  { icon: UtensilsCrossed, title: "featureMenu", body: "featureMenuBody" },
  { icon: BarChart3, title: "featureCustomers", body: "featureCustomersBody" },
  { icon: Settings, title: "featureGrow", body: "featureGrowBody" },
] as const;

export function LoginScreen({
  locale,
  copy,
  brand,
  logoUrl,
  englishHref,
  arabicHref,
  panelTitle,
  panelBody,
  introTitle,
  introBody,
  showIntro = true,
  formFirst = false,
  wide = false,
  children,
}: LoginScreenProps) {
  return (
    <main data-auth="" className={`flex min-h-dvh items-center justify-center px-4 py-6 text-[#0B1736] dark:bg-background dark:text-foreground sm:px-6 ${wide ? "bg-[#F3F7FC]" : "bg-[#eef3f8]"}`}>
      <section className={`grid w-full overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:min-h-[680px] dark:bg-surface dark:shadow-[var(--shadow-card)] ${wide ? "max-w-[1350px] lg:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)]" : "max-w-6xl lg:grid-cols-2"}`}>
        <div className={`relative flex flex-col overflow-hidden px-6 py-8 sm:px-10 sm:py-10 dark:bg-[#241710] ${wide ? "bg-gradient-to-b from-[#fff7f2] to-[#ffe8d8]" : "bg-[#fff3ea]"} ${formFirst ? "order-2 lg:order-1 max-lg:py-6" : ""}`}>
          <div className="pointer-events-none absolute -bottom-16 -start-10 size-56 rounded-full bg-[#ffd7c2]/80 dark:bg-[#ff5722]/10" />
          <div className="pointer-events-none absolute -end-16 bottom-10 size-48 rounded-full bg-[#ffe7d6] dark:bg-[#ff5722]/5" />
          <BrandLockup name={brand} logoUrl={logoUrl} />
          <h1 className={`mt-8 max-w-md text-4xl font-bold tracking-tight text-[#0B1736] sm:text-5xl dark:text-foreground ${formFirst ? "max-lg:mt-0 max-lg:text-2xl" : ""}`}>{panelTitle ?? copy.auth.welcomeTitle}</h1>
          <p className={`mt-4 max-w-md text-base leading-7 text-[#4d627c] dark:text-muted ${formFirst ? "max-lg:mt-2 max-lg:text-sm" : ""}`}>{panelBody ?? copy.auth.welcomeBody}</p>
          <ul className={`mt-8 flex flex-col gap-5 ${formFirst ? "max-lg:hidden" : ""}`}>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#ffe4d6] text-[#FF5722] dark:bg-[#ff5722]/15">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold text-[#0B1736] dark:text-foreground">{copy.auth[feature.title]}</span>
                    <span className="mt-0.5 block text-sm leading-6 text-[#5d728c] dark:text-muted">{copy.auth[feature.body]}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <Image
            src="/auth/login-meal.jpg"
            alt={copy.auth.mealAlt}
            width={960}
            height={540}
            priority
            className={`relative mt-6 w-full object-cover object-[center_70%] ${formFirst ? "h-28 rounded-2xl sm:h-40 lg:mt-auto lg:h-64 lg:rounded-none" : "h-40 rounded-2xl sm:h-52 lg:mt-auto lg:h-64"}`}
          />
        </div>
        <div className={`flex flex-col bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-14 dark:bg-surface ${formFirst ? "order-1 lg:order-2" : ""}`}>
          <div className="flex justify-end">
            <LanguageSelect locale={locale} label={copy.auth.language} englishHref={englishHref} arabicHref={arabicHref} />
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
            {showIntro ? (
              <>
                <h2 className="text-3xl font-bold tracking-tight text-[#0B1736] dark:text-foreground">{introTitle ?? copy.auth.loginHeading}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6b7c93] dark:text-muted">{introBody ?? copy.auth.loginSubtitle}</p>
                <div className="mt-8">{children}</div>
              </>
            ) : children}
          </div>
        </div>
      </section>
    </main>
  );
}
