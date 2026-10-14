import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Notice } from "@/components/auth/notice";
import { ProductForm } from "@/components/menu/product-form";
import { LoadingState } from "@/components/states/loading-state";
import { canEditMenu } from "@/lib/businesses/access";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { currencyExponent, formatMinor } from "@/lib/menus/money";
import { menuPhotoUrl } from "@/lib/menus/image-url";
import { messageFromMenuQuery } from "@/lib/menus/schema";
import { getMyBusiness } from "@/modules/businesses/queries";
import { businessCurrency, getProduct, listCategories } from "@/modules/menus/queries";

type PageProps = {
  params: Promise<{ locale: string; businessId: string; productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).menu.productEditTitle, robots: { index: false, follow: false } };
}

export default async function EditProductPage({ params, searchParams }: PageProps) {
  const { locale, businessId, productId } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <EditProductContent locale={locale} businessId={businessId} productId={productId} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProductContent({
  locale,
  businessId,
  productId,
  searchParams,
}: {
  locale: Locale;
  businessId: string;
  productId: string;
  searchParams: PageProps["searchParams"];
}) {
  const business = await getMyBusiness(businessId);
  if (!business || !canEditMenu(business.role)) notFound();
  const product = await getProduct(business.id, productId);
  if (!product) notFound();
  const copy = getDictionary(locale).menu;
  const query = await searchParams;
  const notice = messageFromMenuQuery(Array.isArray(query.notice) ? query.notice[0] : query.notice);
  const categories = await listCategories(business.id);
  const currency = await businessCurrency(business.id);
  const exponent = currencyExponent(currency) ?? 2;

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <Link href={`/${locale}/dashboard/businesses/${business.id}/menu?tab=products`} className="text-sm font-medium underline-offset-4 hover:underline">
        {copy.back}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{copy.productEditTitle}</h1>
      {notice ? (
        <div className="mt-6 max-w-3xl">
          <Notice tone={notice === "saved" || notice === "created" ? "success" : "error"}>{copy.messages[notice]}</Notice>
        </div>
      ) : null}
      <div className="mt-8">
        <ProductForm
          locale={locale}
          copy={copy}
          businessId={business.id}
          productId={product.id}
          categories={categories.map((category) => ({ id: category.id, name: category.name }))}
          initial={{
            categoryId: product.categoryId,
            name: product.name,
            nameAr: product.nameAr ?? "",
            description: product.description ?? "",
            descriptionAr: product.descriptionAr ?? "",
            price: formatMinor(product.priceCents, exponent),
            compareAt: product.compareAtCents === null ? "" : formatMinor(product.compareAtCents, exponent),
            isActive: product.isActive,
            isPublished: product.isPublished,
            isFeatured: product.isFeatured,
            outOfStock: product.stockStatus === "out_of_stock",
            labels: product.dietaryLabels,
          }}
          variants={product.variants.map((variant) => ({
            key: variant.id,
            id: variant.id,
            name: variant.name,
            nameAr: variant.nameAr ?? "",
            price: formatMinor(variant.priceCents, exponent),
            active: variant.isActive,
          }))}
          addons={product.addons.map((addon) => ({
            key: addon.id,
            id: addon.id,
            name: addon.name,
            nameAr: addon.nameAr ?? "",
            price: formatMinor(addon.priceCents, exponent),
            active: addon.isActive,
          }))}
          images={product.images.flatMap((image) => {
            const url = menuPhotoUrl(image.path);
            return url ? [{ id: image.id, url, alt: product.name }] : [];
          })}
        />
      </div>
    </main>
  );
}
