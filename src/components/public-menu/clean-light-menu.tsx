import { productName } from "./menu-details";
import { BrandMark, CategoryMark, CategoryScroller, FeaturedDishes, MenuDrawer, MenuProducts, MenuStatus, ProductPhoto, heroSource, themeStyle, type ThemeProps } from "./theme-parts";

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
        <div className="relative mx-4 overflow-hidden bg-orange-50 sm:mx-6" style={{ borderRadius: "var(--menu-radius)" }}>
          <div className="grid items-center gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,42%)] sm:p-8">
            <div>
              <h1 dir="auto" className="font-semibold leading-tight" style={{ fontSize: "var(--menu-title)" }}>{menu.name}</h1>
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
        navStyle={menu.appearance.navStyle}
        className="sticky top-0 z-10 bg-[var(--menu-bg)]/95 backdrop-blur"
        itemClassName={(active) => (active ? "text-white" : "bg-white text-[var(--menu-text)] shadow-sm")}
      />
      <main id="menu-content" className="mx-auto w-full max-w-6xl pb-16">
        <MenuStatus menu={menu} copy={copy} query={query} />
        <FeaturedDishes menu={menu} locale={locale} copy={copy} cardClassName="bg-white shadow-[0_10px_30px_rgba(80,40,10,0.08)]" priceClassName="mt-2 text-sm font-semibold text-[var(--menu-primary)]" />
        {menu.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24 px-4 sm:px-6" style={{ paddingBlock: "var(--menu-space)" }}>
            <div className="mb-4 flex items-end justify-between">
              <h2 dir="auto" className="flex items-center gap-2 text-xl font-semibold"><CategoryMark category={category} />{productName(locale, category)}</h2>
              <a href={`#category-${category.id}`} className="text-xs font-medium text-[var(--menu-primary)]">{copy.viewAll}</a>
            </div>
            <MenuProducts products={category.products} menu={menu} locale={locale} copy={copy} cardClassName="bg-white shadow-[0_10px_30px_rgba(80,40,10,0.08)]" priceClassName="mt-2 text-sm font-semibold text-[var(--menu-primary)]" />
          </section>
        ))}
      </main>
    </div>
  );
}
