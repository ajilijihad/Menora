import type { Metadata } from "next";
import { BarChart3, Bookmark, Box, Star } from "lucide-react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Notice } from "@/components/auth/notice";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { PlanCard } from "@/components/dashboard/plan-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentProducts } from "@/components/dashboard/recent-products";
import { RestaurantHero } from "@/components/dashboard/restaurant-hero";
import { SetupCard } from "@/components/dashboard/setup-card";
import { LoadingState } from "@/components/states/loading-state";
import { canEditBusiness, canEditMenu } from "@/lib/businesses/access";
import { businessMediaUrl } from "@/lib/businesses/media-url";
import { hoursAreSet } from "@/lib/businesses/progress";
import { messageFromBusinessQuery } from "@/lib/businesses/schema";
import { daysRemaining, overviewChecklist, overviewPercent, viewTrend } from "@/lib/dashboard/overview";
import { EnvConfigError } from "@/lib/env/error";
import { getPublicEnv } from "@/lib/env/public";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { menuPhotoUrl } from "@/lib/menus/image-url";
import { canonicalMenuUrl } from "@/lib/menus/public-url";
import { loadAnalyticsSummary } from "@/modules/analytics/queries";
import { getAuthenticatedUser } from "@/modules/auth";
import { loadBusinessBilling } from "@/modules/billing/queries";
import { getMyBusiness } from "@/modules/businesses/queries";
import { businessCurrency, listProducts } from "@/modules/menus/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type BusinessPageProps = {
  params: Promise<{ locale: string; businessId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const themeColumns =
  "menu_theme, primary_color, accent_color, background_color, text_color, font_choice, type_scale, card_layout, image_ratio, radius_px, spacing_step, nav_style, featured_style";

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return { title: getDictionary(locale).nav.dashboard, robots: { index: false, follow: false } };
}

export default function BusinessPage({ params, searchParams }: BusinessPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col justify-center">
          <LoadingState />
        </main>
      }
    >
      <BusinessContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function countLabel(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { numberingSystem: "latn" }).format(value);
}

async function BusinessContent({
  params,
  searchParams,
}: {
  params: BusinessPageProps["params"];
  searchParams: BusinessPageProps["searchParams"];
}) {
  const { locale, businessId } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await connection();
  const business = await getMyBusiness(businessId);
  if (!business) {
    notFound();
  }

  const query = await searchParams;
  const dict = getDictionary(locale);
  const copy = dict.dashboard;
  const notice = messageFromBusinessQuery(query.notice);
  const publishedNotice = (Array.isArray(query.notice) ? query.notice[0] : query.notice) === "published";
  const supabase = await createServerSupabaseClient();
  const [categories, products, publishedProducts, featuredProducts, theme, currency, recent, analytics] = await Promise.all([
    supabase.from("menu_categories").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("menu_products").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("menu_products").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("is_published", true),
    supabase.from("menu_products").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("is_featured", true),
    supabase.from("business_theme_settings").select(themeColumns).eq("business_id", business.id).maybeSingle(),
    businessCurrency(business.id),
    listProducts(business.id, { term: "", filter: "all", categoryId: null, page: 1 }),
    loadAnalyticsSummary(business.id, undefined, undefined),
  ]);

  const failure = [categories, products, publishedProducts, featuredProducts, theme].find((result) => result.error);
  if (failure?.error) {
    throw failure.error;
  }

  const steps = overviewChecklist({
    hasInfo: Boolean(business.description || business.phone || business.address || hoursAreSet(business.openingHours)),
    categoryCount: categories.count ?? 0,
    productCount: products.count ?? 0,
    designSaved: Boolean(theme.data),
    published: business.isPublished,
  });
  const user = await getAuthenticatedUser();
  let billing = null;
  if (user && canEditBusiness(business.role)) {
    try {
      billing = await loadBusinessBilling(business.id, user.id);
    } catch {
      billing = null;
    }
  }

  const status = billing?.subscription?.status;
  const days = status === "active" || status === "past_due" ? daysRemaining(billing?.subscription?.currentPeriodEnd ?? null) : null;
  const trend = analytics.ok ? viewTrend(analytics.summary.days) : null;
  const menuViews = analytics.ok ? analytics.summary.menuViews : null;
  let publicUrl = `/menu/${business.slug}`;
  try {
    publicUrl = canonicalMenuUrl(business.slug, getPublicEnv().NEXT_PUBLIC_APP_URL, process.env.NODE_ENV ?? "development") ?? publicUrl;
  } catch (error) {
    if (!(error instanceof EnvConfigError)) {
      throw error;
    }
  }

  const base = `/${locale}/dashboard/businesses/${business.id}`;
  const canEdit = canEditMenu(business.role);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
      <div className="grid gap-4">
        {notice === "created" ? <Notice tone="success">{dict.business.messages.created}</Notice> : null}
        {publishedNotice ? <Notice tone="success">{copy.publishedNotice}</Notice> : null}
        {!canEditBusiness(business.role) ? <p className="text-sm text-muted">{dict.business.readOnly}</p> : null}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.7fr)]">
          <SetupCard
            copy={copy}
            percent={overviewPercent(steps)}
            steps={steps}
            publish={canEditBusiness(business.role) && !business.isPublished ? { locale, businessId: business.id } : null}
          />
          <RestaurantHero
            copy={copy}
            name={business.name}
            description={business.description || dict.business.emptyDescription}
            menuPathLabel={`menu/${business.slug}`}
            publicUrl={publicUrl}
            coverUrl={businessMediaUrl(business.coverPath) ?? "/dashboard/cover-fallback.jpg"}
            published={business.isPublished && business.status === "active"}
            previewHref={`/menu/${business.slug}`}
            qrHref={`${base}/menu/qr`}
            coverHref={canEditBusiness(business.role) ? `${base}/settings` : null}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AnalyticsCard
            label={copy.views}
            value={menuViews === null ? "—" : countLabel(menuViews, locale)}
            detail={menuViews === null ? copy.viewsUnavailable : undefined}
            icon={<BarChart3 className="size-4" />}
            tone="#3B82F6"
            chart={analytics.ok ? analytics.summary.days.map((day) => day.menu) : undefined}
            trend={trend === null ? null : `${trend > 0 ? "+" : ""}${trend}%`}
          />
          <AnalyticsCard
            label={copy.publishedProducts}
            value={countLabel(publishedProducts.count ?? 0, locale)}
            icon={<Box className="size-4" />}
            tone="#10B981"
          />
          <AnalyticsCard
            label={copy.categories}
            value={countLabel(categories.count ?? 0, locale)}
            icon={<Bookmark className="size-4" />}
            tone="#8B5CF6"
          />
          <AnalyticsCard
            label={copy.featured}
            value={countLabel(featuredProducts.count ?? 0, locale)}
            icon={<Star className="size-4" />}
            tone="#F59E0B"
          />
        </div>
        <RecentProducts
          copy={copy}
          locale={locale}
          businessId={business.id}
          currency={currency}
          menuHref={`${base}/menu`}
          canEdit={canEdit}
          products={recent.products.slice(0, 4).map((product) => ({
            id: product.id,
            name: locale === "ar" && product.nameAr ? product.nameAr : product.name,
            priceCents: product.priceCents,
            imageUrl: menuPhotoUrl(product.imagePath),
            isActive: product.isActive,
          }))}
        />
      </div>
      <div className="grid gap-4">
        <PlanCard
          copy={copy}
          name={billing?.entitlement.name ?? null}
          days={days}
          href={business.role === "owner" ? `/${locale}/dashboard/billing` : null}
        />
        {canEdit ? <QuickActions copy={copy} base={base} /> : null}
      </div>
    </div>
  );
}
