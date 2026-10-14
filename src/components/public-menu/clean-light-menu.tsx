import { productName } from "./menu-details";
import { BrandMark, CategoryScroller, DishCopy, MenuDrawer, MenuStatus, ProductPhoto, heroSource, themeStyle, type ThemeProps } from "./theme-parts";

export function CleanLightMenu({ menu, locale, copy, query, search, language }: ThemeProps) {
  const hero = heroSource(menu);

  return (
    <div data-public-menu="" className="min-h-dvh" style={themeStyle(menu.appearance, "light")}>
      <a href="#menu-content" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-white focus:px-4 focus:py-2">{copy.skipToMenu}</a>
      <header>
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <MenuDrawer copy={copy} menu={menu} locale={locale} search={search} buttonClassName="grid size-10 place-items-center rounded-full border border-black/10" />
          <BrandMark menu={menu} className="flex min-w-0 items-center gap-2" imageClassName="size-10 rounded-full object-cover" />
          <div className="rounded-full border border-black/10 px-3 py-1 text-xs">{language}</div>
        </div>
        <div className="relative mx-4 overflow-hidden rounded-[1.8rem] bg-orange-50 sm:mx-6">
          <div className="grid items-center gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,42%)] sm:p-8">
            <div>
              <h1 dir="auto" className="text-3xl font-semibold leading-tight sm:text-5xl">{menu.name}</h1>
              {menu.description ? <p dir="auto" className="mt-3 max-w-md text-sm leading-6 opacity-70">{menu.description}</p> : null}
            </div>
            <ProductPhoto src={hero} alt="" className="aspect-[4/3] w-full rounded-[1.4rem]" />
          </div>
        </div>
      </header>
      <CategoryScroller
        categories={menu.categories}
        locale={locale}
        copy={copy}
        className="sticky top-0 z-10 bg-[var(--menu-bg)]/95 backdrop-blur"
        itemClassName={(active) =>
          `inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium shadow-sm ${active ? "bg-[var(--menu-primary)] text-white" : "bg-white text-[var(--menu-text)]"}`
        }
      />
      <main id="menu-content" className="mx-auto w-full max-w-6xl pb-16">
        <MenuStatus menu={menu} copy={copy} query={query} />
        {menu.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24 px-4 py-5 sm:px-6">
            <div className="mb-4 flex items-end justify-between">
              <h2 dir="auto" className="text-xl font-semibold">{productName(locale, category)}</h2>
              <a href={`#category-${category.id}`} className="text-xs font-medium text-[var(--menu-primary)]">{copy.viewAll}</a>
            </div>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {category.products.map((product) => (
                <li key={product.id} data-analytics-product={product.id} className="overflow-hidden rounded-[1.3rem] bg-white shadow-[0_10px_30px_rgba(80,40,10,0.08)]">
                  <ProductPhoto src={product.imageUrls[0] ?? null} alt="" className="aspect-[4/3] w-full" />
                  <div className="p-3">
                    <DishCopy product={product} locale={locale} copy={copy} currency={menu.currency} priceClassName="mt-2 text-sm font-semibold text-[var(--menu-primary)]" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
