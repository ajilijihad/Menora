import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductForm } from "@/components/menu/product-form";
import { LoadingState } from "@/components/states/loading-state";
import { statusActionClassName } from "@/components/states/status-panel";
import { canEditMenu } from "@/lib/businesses/access";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getMyBusiness } from "@/modules/businesses/queries";
import { listCategories } from "@/modules/menus/queries";

type PageProps = { params: Promise<{ locale: string; businessId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).menu.productTitle, robots: { index: false, follow: false } };
}

export default async function NewProductPage({ params }: PageProps) {
  const { locale, businessId } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <NewProductContent locale={locale} businessId={businessId} />
    </Suspense>
  );
}

async function NewProductContent({ locale, businessId }: { locale: Locale; businessId: string }) {
  const business = await getMyBusiness(businessId);
  if (!business || !canEditMenu(business.role)) notFound();
  const copy = getDictionary(locale).menu;
  const categories = await listCategories(business.id);
  const menuHref = `/${locale}/dashboard/businesses/${business.id}/menu`;

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <Link href={`${menuHref}?tab=products`} className="text-sm font-medium underline-offset-4 hover:underline">{copy.back}</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{copy.productTitle}</h1>
      {categories.length === 0 ? (
        <div className="mt-8 max-w-xl rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-medium">{copy.emptyCategoriesTitle}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{copy.emptyCategoriesDescription}</p>
          <Link href={`${menuHref}/categories/new`} className={`${statusActionClassName} mt-4`}>
            {copy.addCategory}
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <ProductForm
            locale={locale}
            copy={copy}
            businessId={business.id}
            categories={categories.map((category) => ({ id: category.id, name: category.name }))}
            initial={{
              categoryId: categories[0]?.id ?? "",
              name: "",
              nameAr: "",
              description: "",
              descriptionAr: "",
              price: "",
              compareAt: "",
              isActive: true,
              isPublished: false,
              isFeatured: false,
              outOfStock: false,
              labels: [],
            }}
            variants={[]}
            addons={[]}
            images={[]}
          />
        </div>
      )}
    </main>
  );
}
