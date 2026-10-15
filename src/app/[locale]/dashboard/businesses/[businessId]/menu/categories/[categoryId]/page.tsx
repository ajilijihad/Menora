import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryForm } from "@/components/menu/category-form";
import { LoadingState } from "@/components/states/loading-state";
import { canEditMenu } from "@/lib/businesses/access";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getMyBusiness } from "@/modules/businesses/queries";
import { getCategory } from "@/modules/menus/queries";

type PageProps = { params: Promise<{ locale: string; businessId: string; categoryId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).menu.categoryEditTitle, robots: { index: false, follow: false } };
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { locale, businessId, categoryId } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <EditCategoryContent locale={locale} businessId={businessId} categoryId={categoryId} />
    </Suspense>
  );
}

async function EditCategoryContent({
  locale,
  businessId,
  categoryId,
}: {
  locale: Locale;
  businessId: string;
  categoryId: string;
}) {
  const business = await getMyBusiness(businessId);
  if (!business || !canEditMenu(business.role)) notFound();
  const category = await getCategory(business.id, categoryId);
  if (!category) notFound();
  const copy = getDictionary(locale).menu;
  return (
    <main className="flex-1 flex-col">
      <Link href={`/${locale}/dashboard/businesses/${business.id}/menu`} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand transition hover:text-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {copy.back}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{copy.categoryEditTitle}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{copy.categoryEditIntro}</p>
      <div className="mt-6">
        <CategoryForm
          locale={locale}
          copy={copy}
          businessId={business.id}
          categoryId={category.id}
          initial={{
            name: category.name,
            nameAr: category.nameAr ?? "",
            description: category.description ?? "",
            descriptionAr: category.descriptionAr ?? "",
            isActive: category.isActive,
            isPublished: category.isPublished,
          }}
        />
      </div>
    </main>
  );
}
