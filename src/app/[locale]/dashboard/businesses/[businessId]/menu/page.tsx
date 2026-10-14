import type { Metadata } from "next";
import { Box, Check, Eye, ExternalLink, Folder, FolderTree, ImageIcon, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { Notice } from "@/components/auth/notice";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { CopyValue } from "@/components/dashboard/domain-controls";
import { CategorySorter } from "@/components/menu/category-sorter";
import { MenuTabs } from "@/components/menu/menu-tabs";
import { CurrencyForm } from "@/components/menu/currency-form";
import { MenuFilters } from "@/components/menu/menu-filters";
import { RowActions } from "@/components/menu/row-actions";
import { ThemePreview } from "@/components/menu/theme-preview";
import { LoadingState } from "@/components/states/loading-state";
import { canEditBusiness, canEditMenu } from "@/lib/businesses/access";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/i18n/format";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { menuPhotoUrl } from "@/lib/menus/image-url";
import {
  messageFromMenuQuery,
  parseMenuFilter,
  parsePage,
  searchTerm,
  menuFilters,
} from "@/lib/menus/schema";
import type { MenuCopy } from "@/lib/i18n/menu-copy";
import { canAddProduct } from "@/modules/billing/queries";
import { getMyBusiness } from "@/modules/businesses/queries";
import { businessCurrency, categoryCoverPaths, getMenuTheme, listCategories, listProducts, menuStats, type MenuCategoryRecord, type MenuProductRecord } from "@/modules/menus/queries";

type MenuPageProps = {
  params: Promise<{ locale: string; businessId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const cardClassName = "rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5";
const primaryClassName = "inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover";
const secondaryClassName = "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-brand/40 px-4 text-sm font-semibold text-brand";
const editClassName = "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-brand/40 bg-surface px-3 text-sm font-medium text-brand hover:bg-orange-500/10";

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).menu.title, robots: { index: false, follow: false } };
}

export default function MenuPage({ params, searchParams }: MenuPageProps) {
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState /></main>}>
      <MenuContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function fill(template: string, count: number) {
  return template.replaceAll("{count}", String(count));
}

function errorNotice(notice: string) {
  return notice === "save_failed" || notice === "not_found" || notice.endsWith("invalid") || notice.includes("failed") || notice === "forbidden" || notice === "rate_limited" || notice === "unconfigured" || notice === "name_taken" || notice === "image_limit" || notice === "plan_limit";
}

async function MenuContent({
  params,
  searchParams,
}: {
  params: MenuPageProps["params"];
  searchParams: MenuPageProps["searchParams"];
}) {
  const { locale, businessId } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const business = await getMyBusiness(businessId);
  if (!business || !canEditMenu(business.role)) {
    notFound();
  }

  const query = await searchParams;
  const dictionary = getDictionary(locale);
  const copy = dictionary.menu;
  const notice = messageFromMenuQuery(query.notice);
  const term = searchTerm(first(query.q));
  const filter = parseMenuFilter(first(query.filter));
  const page = parsePage(first(query.page));
  const categoryId = first(query.category) ?? "";
  const categoryTerm = searchTerm(first(query.cq));
  const categorySort = first(query.csort) === "name" ? "name" : "order";
  const tab = first(query.tab) === "products" ? "products" : "categories";
  const categories = await listCategories(business.id);
  const selectedCategory = categories.some((category) => category.id === categoryId) ? categoryId : null;
  const [currency, theme, stats, covers, listed] = await Promise.all([
    businessCurrency(business.id),
    getMenuTheme(business.id, business.businessType),
    menuStats(business.id, categories.map((category) => category.id)),
    categoryCoverPaths(business.id),
    listProducts(business.id, { term, filter, categoryId: selectedCategory, page }),
  ]);
  const { products, total, pageSize } = listed;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = `/${locale}/dashboard/businesses/${business.id}/menu`;
  const publicPath = `/menu/${business.slug}`;
  const publishedMenu = business.isPublished && business.status === "active";
  const productLimitReached = canEditBusiness(business.role) ? !(await canAddProduct(business.id)) : false;
  const numbers = new Intl.NumberFormat(locale);
  const filtered = Boolean(term || filter !== "all" || selectedCategory);
  const shownCategories = categories
    .filter((category) => {
      if (!categoryTerm) {
        return true;
      }
      return `${category.name} ${category.nameAr ?? ""}`.toLocaleLowerCase().includes(categoryTerm.toLocaleLowerCase());
    })
    .sort((left, right) => (
      categorySort === "name"
        ? displayCategory(left.name, left.nameAr, locale).localeCompare(displayCategory(right.name, right.nameAr, locale), locale)
        : left.sortOrder - right.sortOrder
    ));
  const canReorder = categorySort === "order" && !categoryTerm;
  const unpublished = Math.max(0, stats.products - stats.published);

  function pageHref(nextPage: number, nextTab = tab) {
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (filter !== "all") params.set("filter", filter);
    if (selectedCategory) params.set("category", selectedCategory);
    if (categoryTerm) params.set("cq", categoryTerm);
    if (categorySort === "name") params.set("csort", "name");
    if (nextTab === "products") params.set("tab", "products");
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.toString();
    return search ? `${base}?${search}` : base;
  }

  const emptyCopy = !filtered
    ? { title: copy.emptyProductsTitle, body: copy.emptyProductsDescription }
    : term
      ? { title: copy.noMatches, body: copy.noMatches }
      : selectedCategory
        ? { title: copy.noCategoryMatches, body: copy.noCategoryMatches }
        : { title: copy.noStatusMatches, body: copy.noStatusMatches };

  return (
    <main className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted">{copy.description}</p>
      </header>
      {productLimitReached ? (
        <UpgradePrompt
          title={dictionary.billing.upgradeTitle}
          description={dictionary.billing.upgradeDescription}
          href={`/${locale}/dashboard/billing`}
          action={dictionary.billing.upgradeAction}
        />
      ) : null}
      {notice ? <Notice tone={errorNotice(notice) ? "error" : "success"}>{copy.messages[notice]}</Notice> : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Folder className="size-5" />} tint="bg-orange-500/10 text-brand" label={copy.statCategories} value={numbers.format(categories.length)} />
        <Stat icon={<Box className="size-5" />} tint="bg-violet-500/10 text-violet-600 dark:text-violet-300" label={copy.statProducts} value={numbers.format(stats.products)} />
        <Stat icon={<Check className="size-5" />} tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" label={copy.statPublished} value={numbers.format(stats.published)} />
        <Stat icon={<Eye className="size-5" />} tint="bg-sky-500/10 text-sky-600 dark:text-sky-300" label={copy.statUnpublished} value={numbers.format(unpublished)} />
      </section>
      <section className={`${cardClassName} flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line">
            <div className="w-28 origin-top scale-[0.58]"><ThemePreview theme={theme} /></div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{copy.publicMenu}</p>
            <p dir="ltr" className="truncate text-sm text-muted">{publicPath}</p>
            <p className="mt-1 text-xs text-muted">{copy.themeLabel}: {dictionary.appearance.themes[theme]}</p>
          </div>
          <CopyValue value={publicPath} label={copy.copyUrl} copiedLabel={copy.copied} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {publishedMenu ? (
            <a href={publicPath} className={secondaryClassName}><ExternalLink className="size-4" />{copy.openPublic}</a>
          ) : (
            <p className="text-sm text-muted">{copy.publicHidden}</p>
          )}
          <Link href={`${base}/appearance`} className={primaryClassName}>{copy.customizeAppearance}</Link>
          <Link href={`${base}/qr`} className={secondaryClassName}>{dictionary.qr.title}</Link>
          <CurrencyForm locale={locale} copy={copy} businessId={business.id} currency={currency} canEdit={canEditBusiness(business.role)} />
        </div>
      </section>
      <MenuTabs
        active={tab}
        categoriesLabel={copy.categoriesTitle}
        productsLabel={copy.productsTitle}
        categoriesHref={pageHref(page, "categories")}
        productsHref={pageHref(page, "products")}
      />
      {tab === "categories" ? <section id="menu-categories" className={cardClassName}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{copy.categoriesTitle}</h2>
            <p className="text-sm text-muted">{copy.categoriesSubtitle}</p>
          </div>
          <MenuFilters action={base} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {term ? <input type="hidden" name="q" value={term} /> : null}
            {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
            {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
            <label className="relative min-w-0 sm:w-56">
              <span className="sr-only">{copy.searchCategories}</span>
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input name="cq" defaultValue={categoryTerm} placeholder={copy.searchCategories} className="h-10 w-full rounded-xl border border-line bg-surface ps-10 pe-3 text-sm" />
            </label>
            <label className="relative">
              <span className="sr-only">{copy.sort}</span>
              <select name="csort" defaultValue={categorySort} aria-label={copy.sort} className="h-10 rounded-xl border border-line bg-surface px-3 pe-8 text-sm">
                <option value="order">{copy.sortManual}</option>
                <option value="name">{copy.sortName}</option>
              </select>
            </label>
            <Link href={`${base}/categories/new`} className={primaryClassName}><Plus className="size-4" />{copy.addCategory}</Link>
            <button type="submit" className="sr-only">{copy.search}</button>
          </MenuFilters>
        </div>
        {categories.length === 0 ? (
          <div className="mt-6 flex flex-col items-center px-4 py-8 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-brand"><FolderTree className="size-7" /></span>
            <h3 className="mt-3 font-semibold">{copy.emptyCategoriesTitle}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">{copy.emptyCategoriesDescription}</p>
            <Link href={`${base}/categories/new`} className={`${primaryClassName} mt-4`}>{copy.addCategory}</Link>
          </div>
        ) : shownCategories.length === 0 ? (
          <p className="mt-6 text-sm text-muted">{copy.noMatches}</p>
        ) : (
          <CategorySorter locale={locale} businessId={business.id} ids={shownCategories.map((category) => category.id)} enabled={canReorder} label={copy.moveUp}>
            {shownCategories.map((category) => {
              const count = stats.byCategory.get(category.id) ?? 0;
              const primary = displayCategory(category.name, category.nameAr, locale);
              const secondary = locale === "ar" ? category.name : category.nameAr;
              const cover = menuPhotoUrl(covers.get(category.id) ?? null);
              return (
                <div key={category.id} className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  {cover ? (
                    // Category covers reuse the first product photo already stored for this menu.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted"><FolderTree className="size-5" /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="font-medium">{primary}</p>
                    <p className="text-sm text-muted">{count === 1 ? copy.oneProduct : fill(copy.manyProducts, count)}</p>
                    {secondary && secondary !== primary ? <p dir="auto" className="text-xs text-muted">{secondary}</p> : null}
                  </div>
                  <StatusBadge published={category.isPublished} copy={copy} />
                  <Link href={`${base}/categories/${category.id}`} className={editClassName}><Pencil className="size-3.5" />{copy.edit}</Link>
                  <RowActions locale={locale} copy={copy} businessId={business.id} recordId={category.id} kind="category" isPublished={category.isPublished} editHref={`${base}/categories/${category.id}`} />
                </div>
              );
            })}
          </CategorySorter>
        )}
      </section> : <section id="menu-products" className={cardClassName}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{copy.productsTitle}</h2>
            <p className="text-sm text-muted">{copy.productsSubtitle}</p>
          </div>
          {categories.length > 0 ? (
            <MenuFilters action={base} className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
              {categoryTerm ? <input type="hidden" name="cq" value={categoryTerm} /> : null}
              {categorySort === "name" ? <input type="hidden" name="csort" value="name" /> : null}
              <input type="hidden" name="tab" value="products" />
              <label className="relative min-w-0 lg:w-48">
                <span className="sr-only">{copy.searchLabel}</span>
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input name="q" defaultValue={term} placeholder={copy.searchLabel} className="h-10 w-full rounded-xl border border-line bg-surface ps-10 pe-3 text-sm" />
              </label>
              <select name="category" defaultValue={selectedCategory ?? ""} aria-label={copy.categoryLabel} className="h-10 rounded-xl border border-line bg-surface px-3 text-sm">
                <option value="">{copy.allCategories}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{displayCategory(category.name, category.nameAr, locale)}</option>
                ))}
              </select>
              <select name="filter" defaultValue={filter} aria-label={copy.filterLabel} className="h-10 rounded-xl border border-line bg-surface px-3 text-sm">
                {menuFilters.map((item) => (
                  <option key={item} value={item}>{copy.filters[item]}</option>
                ))}
              </select>
              <Link href={`${base}/products/new`} className={primaryClassName}><Plus className="size-4" />{copy.addProduct}</Link>
              <button type="submit" className="sr-only">{copy.search}</button>
            </MenuFilters>
          ) : null}
        </div>
        {products.length === 0 ? (
          <div className="mt-6 flex flex-col items-center px-4 py-8 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Box className="size-7" /></span>
            <h3 className="mt-3 font-semibold">{emptyCopy.title}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">{emptyCopy.body}</p>
            {!filtered && categories.length > 0 ? <Link href={`${base}/products/new`} className={`${primaryClassName} mt-4`}>{copy.addProduct}</Link> : null}
            {filtered ? <Link href={clearProductFilters(base, categoryTerm, categorySort)} className={`${secondaryClassName} mt-4`}>{copy.filters.all}</Link> : null}
          </div>
        ) : (
          <ProductList
            products={products}
            categories={categories}
            locale={locale}
            currency={currency}
            copy={copy}
            businessId={business.id}
            base={base}
          />
        )}
        {pages > 1 ? (
          <nav className="mt-4 flex items-center gap-4 text-sm">
            {page > 1 ? <Link href={pageHref(page - 1)}>{copy.previous}</Link> : <span className="text-muted">{copy.previous}</span>}
            <span>{page} / {pages}</span>
            {page < pages ? <Link href={pageHref(page + 1)}>{copy.next}</Link> : <span className="text-muted">{copy.next}</span>}
          </nav>
        ) : null}
      </section>}
    </main>
  );
}

function Stat({ icon, tint, label, value }: { icon: ReactNode; label: string; value: string; tint: string }) {
  return (
    <article className="flex items-center gap-3 rounded-3xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
      <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${tint}`}>{icon}</span>
      <span>
        <span className="block text-sm text-muted">{label}</span>
        <span className="block text-2xl font-semibold tabular-nums">{value}</span>
      </span>
    </article>
  );
}

function StatusBadge({ published, copy }: { published: boolean; copy: MenuCopy }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${published ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-800 dark:text-amber-200"}`}>
      <span className={`size-1.5 rounded-full ${published ? "bg-emerald-500" : "bg-amber-500"}`} />
      {published ? copy.published : copy.draft}
    </span>
  );
}

function displayName(product: MenuProductRecord, locale: Locale) {
  return locale === "ar" && product.nameAr ? product.nameAr : product.name;
}

function displayCategory(name: string, nameAr: string | null, locale: Locale) {
  return locale === "ar" && nameAr ? nameAr : name;
}

function categoryLabel(categories: MenuCategoryRecord[], categoryId: string, locale: Locale) {
  const category = categories.find((item) => item.id === categoryId);
  return category ? displayCategory(category.name, category.nameAr, locale) : "";
}

function clearProductFilters(base: string, categoryTerm: string, categorySort: string) {
  const params = new URLSearchParams();
  if (categoryTerm) params.set("cq", categoryTerm);
  if (categorySort === "name") params.set("csort", "name");
  params.set("tab", "products");
  const search = params.toString();
  return `${base}?${search}`;
}

function PriceLine({ product, currency, locale }: { product: MenuProductRecord; currency: string; locale: Locale }) {
  return (
    <p className="text-sm font-semibold">
      {formatMoney(product.priceCents, currency, locale)}
      {product.compareAtCents !== null ? <span className="ms-2 font-normal text-muted line-through">{formatMoney(product.compareAtCents, currency, locale)}</span> : null}
    </p>
  );
}

function ProductMarks({ product, copy }: { product: MenuProductRecord; copy: MenuCopy }) {
  if (product.stockStatus !== "out_of_stock" && !product.isFeatured) {
    return null;
  }
  return (
    <p className="text-xs text-muted">
      {product.stockStatus === "out_of_stock" ? copy.filters.out_of_stock : null}
      {product.stockStatus === "out_of_stock" && product.isFeatured ? " · " : null}
      {product.isFeatured ? copy.filters.featured : null}
    </p>
  );
}

function ProductList({
  products,
  categories,
  locale,
  currency,
  copy,
  businessId,
  base,
}: {
  products: MenuProductRecord[];
  categories: MenuCategoryRecord[];
  locale: Locale;
  currency: string;
  copy: MenuCopy;
  businessId: string;
  base: string;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-line text-start text-muted">
            <th className="px-3 py-2 font-medium">{copy.productsTitle}</th>
            <th className="px-3 py-2 font-medium">{copy.categoryLabel}</th>
            <th className="px-3 py-2 font-medium">{copy.fields.price}</th>
            <th className="px-3 py-2 font-medium">{copy.filterLabel}</th>
            <th className="px-3 py-2 text-end font-medium">{copy.edit}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const photo = menuPhotoUrl(product.imagePath);
            const editHref = `${base}/products/${product.id}`;
            return (
              <tr key={product.id} className="border-b border-line/80 hover:bg-surface-muted">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted"><ImageIcon className="size-4" /></span>
                    )}
                    <span dir="auto" className="font-medium">{displayName(product, locale)}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted">{categoryLabel(categories, product.categoryId, locale)}</td>
                <td className="px-3 py-3"><PriceLine product={product} currency={currency} locale={locale} /></td>
                <td className="px-3 py-3">
                  <StatusBadge published={product.isPublished} copy={copy} />
                  <ProductMarks product={product} copy={copy} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={editHref} className={editClassName}><Pencil className="size-3.5" />{copy.edit}</Link>
                    <RowActions locale={locale} copy={copy} businessId={businessId} recordId={product.id} kind="product" isPublished={product.isPublished} editHref={editHref} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
