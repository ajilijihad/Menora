import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { formatMoney } from "@/lib/i18n/format";
import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/locales";
import { setProductActiveAction } from "@/modules/menus/actions";

type ProductItem = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  isActive: boolean;
};

type RecentProductsProps = {
  copy: DashboardCopy;
  locale: Locale;
  businessId: string;
  currency: string;
  products: ProductItem[];
  menuHref: string;
  canEdit: boolean;
};

export function RecentProducts({ copy, locale, businessId, currency, products, menuHref, canEdit }: RecentProductsProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{copy.recentProducts}</h2>
        <Link href={menuHref} className="text-sm font-medium text-brand">
          {copy.viewAll}
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-surface px-4 py-8 text-sm text-muted">{copy.noProducts}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => {
            const price = formatMoney(product.priceCents, currency, locale);
            return (
              <li key={product.id} className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)]">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="h-28 w-full object-cover" />
                ) : (
                  <div className="h-28 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-500/15 dark:to-amber-400/10" />
                )}
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="mt-1 text-sm text-muted">{price}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEdit ? (
                      <form action={setProductActiveAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="businessId" value={businessId} />
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="active" value={product.isActive ? "0" : "1"} />
                        <button
                          type="submit"
                          role="switch"
                          aria-checked={product.isActive}
                          aria-label={product.isActive ? copy.available : copy.unavailable}
                          className={`relative h-6 w-11 rounded-full transition ${product.isActive ? "bg-emerald-500" : "bg-line"}`}
                        >
                          <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow ${product.isActive ? "start-5" : "start-0.5"}`} />
                        </button>
                      </form>
                    ) : null}
                    <Link
                      href={`${menuHref}/products/${product.id}`}
                      aria-label={copy.editProduct}
                      className="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
