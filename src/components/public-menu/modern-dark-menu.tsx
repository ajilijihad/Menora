import { productName } from "./menu-details";
import { BrandMark, CategoryScroller, DishCopy, MenuDrawer, MenuStatus, ProductPhoto, heroSource, themeStyle, type ThemeProps } from "./theme-parts";

export function ModernDarkMenu({ menu, locale, copy, query, search, language }: ThemeProps) {
  const hero = heroSource(menu);

  return (
    <div data-public-menu="" className="min-h-dvh" style={themeStyle(menu.appearance, "dark")}>
      <a href="#menu-content" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-[var(--menu-bg)] focus:px-4 focus:py-2">{copy.skipToMenu}</a>
      <header className="relative">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <MenuDrawer copy={copy} menu={menu} locale={locale} search={search} buttonClassName="grid size-10 place-items-center rounded-full text-[var(--menu-text)]" />
          <BrandMark menu={menu} className="flex min-w-0 items-center gap-2" imageClassName="size-9 rounded-full object-cover" />
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs">{language}</div>
        </div>
        <div className="relative mx-4 min-h-72 overflow-hidden rounded-[1.6rem] sm:mx-6 sm:min-h-96">
          <ProductPhoto src={hero} alt="" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            {menu.description ? <p dir="auto" className="max-w-md text-2xl font-semibold leading-tight sm:text-4xl">{menu.description}</p> : <h1 dir="auto" className="text-3xl font-semibold">{menu.name}</h1>}
          </div>
        </div>
      </header>
      <CategoryScroller
        categories={menu.categories}
        locale={locale}
        copy={copy}
        className="sticky top-0 z-10 bg-[var(--menu-bg)]/95 backdrop-blur"
        itemClassName={(active) =>
          `inline-flex h-11 items-center gap-2 rounded-2xl px-3 text-xs font-medium ${active ? "bg-[var(--menu-primary)] text-black" : "bg-white/5 text-[var(--menu-text)]"}`
        }
      />
      <main id="menu-content" className="mx-auto w-full max-w-5xl pb-16">
        <MenuStatus menu={menu} copy={copy} query={query} />
        {menu.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24 px-4 py-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 dir="auto" className="flex items-center gap-2 text-base font-semibold">
                <span className="text-[var(--menu-primary)]" aria-hidden="true">◆</span>
                {productName(locale, category)}
              </h2>
              <a href={`#category-${category.id}`} className="text-xs text-[var(--menu-secondary)]">{copy.viewAll}</a>
            </div>
            <ul className="grid gap-3 lg:grid-cols-2">
              {category.products.map((product) => (
                <li key={product.id} data-analytics-product={product.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                  <ProductPhoto src={product.imageUrls[0] ?? null} alt="" className="size-20 shrink-0 rounded-xl" />
                  <DishCopy product={product} locale={locale} copy={copy} currency={menu.currency} priceClassName="mt-1 text-sm font-semibold text-[var(--menu-primary)]" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
