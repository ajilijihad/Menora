import { ArrowLeft } from "lucide-react";
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
import { businessCurrency, listCategories } from "@/modules/menus/queries";

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
  const currency = await businessCurrency(business.id);
  const menuHref = `/${locale}/dashboard/businesses/${business.id}/menu`;

  return (
    <main className="flex-1 flex-col">
      <Link href={`${menuHref}?tab=products`} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand transition hover:text-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {copy.back}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{copy.productTitle}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{copy.productIntro}</p>
      {categories.length === 0 ? (
        <div className="mt-6 max-w-xl rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <h2 className="font-medium">{copy.emptyCategoriesTitle}</h2>
          <p className="mt-2 text-sm text-muted">{copy.emptyCategoriesDescription}</p>
          <Link href={`${menuHref}/categories/new`} className={`${statusActionClassName} mt-4`}>
            {copy.addCategory}
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <ProductForm
            locale={locale}
            copy={copy}
            businessId={business.id}
            currency={currency}
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
