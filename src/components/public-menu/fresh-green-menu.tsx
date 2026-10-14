import { productName } from "./menu-details";
import { BrandMark, CategoryScroller, DishCopy, MenuDrawer, MenuStatus, ProductPhoto, heroSource, themeStyle, type ThemeProps } from "./theme-parts";

export function FreshGreenMenu({ menu, locale, copy, query, search, language }: ThemeProps) {
  const hero = heroSource(menu);

  return (
    <div data-public-menu="" className="min-h-dvh" style={themeStyle(menu.appearance, "light")}>
      <a href="#menu-content" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-[#f6f3ea] focus:px-4 focus:py-2">{copy.skipToMenu}</a>
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute -end-8 top-0 h-40 w-40 rounded-full bg-[var(--menu-secondary)]/20 blur-2xl" />
        <div className="pointer-events-none absolute start-0 top-24 h-24 w-24 rounded-full bg-[var(--menu-primary)]/10 blur-xl" />
        <div className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <MenuDrawer copy={copy} menu={menu} locale={locale} search={search} buttonClassName="grid size-10 place-items-center rounded-full border border-[var(--menu-primary)]/20 text-[var(--menu-primary)]" />
          <BrandMark menu={menu} className="flex min-w-0 items-center gap-2 text-[var(--menu-primary)]" imageClassName="size-10 rounded-full object-cover" />
          <div className="rounded-full bg-[var(--menu-primary)]/10 px-3 py-1 text-xs text-[var(--menu-primary)]">{language}</div>
        </div>
        <div className="relative mx-4 grid items-center gap-4 overflow-hidden rounded-[2rem] bg-[#e7f0e4] p-5 sm:mx-6 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,46%)] sm:p-8">
          <div>
            <h1 dir="auto" className="text-3xl font-semibold leading-tight text-[var(--menu-primary)] sm:text-5xl">{menu.name}</h1>
            {menu.description ? <p dir="auto" className="mt-3 max-w-md text-sm leading-6 text-[var(--menu-text)]/75">{menu.description}</p> : null}
          </div>
          <ProductPhoto src={hero} alt="" className="aspect-square w-full rounded-[1.6rem]" />
        </div>
      </header>
      <CategoryScroller
        categories={menu.categories}
        locale={locale}
        copy={copy}
        className="sticky top-0 z-10 bg-[var(--menu-bg)]/95 backdrop-blur"
        itemClassName={(active) =>
          `inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm ${active ? "bg-[var(--menu-primary)] text-white" : "bg-white text-[var(--menu-primary)]"}`
        }
      />
      <main id="menu-content" className="mx-auto w-full max-w-6xl pb-16">
        <MenuStatus menu={menu} copy={copy} query={query} />
        {menu.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24 px-4 py-5 sm:px-6">
            <h2 dir="auto" className="mb-4 text-lg font-semibold text-[var(--menu-primary)]">{productName(locale, category)}</h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {category.products.map((product) => (
                <li key={product.id} data-analytics-product={product.id} className="rounded-[1.4rem] bg-white p-2 shadow-[0_8px_24px_rgba(40,70,40,0.06)]">
                  <ProductPhoto src={product.imageUrls[0] ?? null} alt="" className="aspect-square w-full rounded-[1.1rem]" />
                  <div className="p-2">
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
