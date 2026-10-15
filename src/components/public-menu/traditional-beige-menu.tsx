import { productName } from "./menu-details";
import { BrandMark, CategoryMark, CategoryScroller, FeaturedDishes, MenuDrawer, MenuProducts, MenuStatus, ProductPhoto, heroSource, themeStyle, type ThemeProps } from "./theme-parts";

const paper = {
  backgroundImage:
    "radial-gradient(circle at 12% 8%, rgba(140,90,40,0.08), transparent 28%), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(90,50,20,0.035) 4px)",
};

export function TraditionalBeigeMenu({ menu, locale, copy, query, search, language }: ThemeProps) {
  const hero = heroSource(menu);

  return (
    <div data-public-menu="" className="min-h-dvh px-2 py-3 sm:px-6 sm:py-6" style={{ backgroundColor: "#e6d0ae", colorScheme: "light" }}>
      <div className="mx-auto max-w-3xl border-8 border-[#6b3e26] shadow-[0_0_0_6px_#e6d0ae,0_0_0_8px_#a56b45]" style={{ ...themeStyle(menu.appearance, "light"), ...paper }}>
        <a href="#menu-content" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-[#f4e7d2] focus:px-4 focus:py-2">{copy.skipToMenu}</a>
        <header>
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
            <MenuDrawer copy={copy} menu={menu} locale={locale} search={search} buttonClassName="grid size-10 place-items-center rounded-full border border-[#6b3e26]/30" />
            <BrandMark menu={menu} className="flex min-w-0 flex-col items-center gap-1 text-center" imageClassName="size-12 rounded-full object-cover" />
            <div className="rounded-full border border-[#6b3e26]/30 px-3 py-1 text-xs">{language}</div>
          </div>
          <div className="relative mx-3 overflow-hidden border border-[#8a5a32]/40 sm:mx-5" style={{ borderRadius: "var(--menu-radius)" }}>
            <ProductPhoto src={hero} alt="" className="aspect-[16/10] w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3b2415]/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-[#f4e7d2]">
              <h1 dir="auto" className="font-serif" style={{ fontSize: "var(--menu-title)" }}>{menu.name}</h1>
              {menu.description ? <p dir="auto" className="mt-1 max-w-md text-sm">{menu.description}</p> : null}
            </div>
          </div>
        </header>
        <CategoryScroller
          categories={menu.categories}
          locale={locale}
          copy={copy}
          navStyle={menu.appearance.navStyle}
          className="sticky top-0 z-10 bg-[var(--menu-bg)]/95"
          itemClassName={(active) => (active ? "text-[#f4e7d2]" : "bg-[#ead7b8] text-[#3b2415]")}
        />
        <main id="menu-content" className="pb-10">
          <MenuStatus menu={menu} copy={copy} query={query} />
          <FeaturedDishes menu={menu} locale={locale} copy={copy} cardClassName="border-b border-[#6b3e26]/20" priceClassName="mt-1 text-sm font-semibold text-[#6b3e26]" />
          {menu.categories.map((category) => (
            <section key={category.id} id={`category-${category.id}`} className="scroll-mt-20 px-3 sm:px-5" style={{ paddingBlock: "var(--menu-space)" }}>
              <h2 dir="auto" className="mb-2 flex items-center gap-3 font-serif text-lg">
                <span className="h-px flex-1 bg-[#6b3e26]/30" />
                <CategoryMark category={category} />
                {productName(locale, category)}
                <span className="h-px flex-1 bg-[#6b3e26]/30" />
              </h2>
              <MenuProducts products={category.products} menu={menu} locale={locale} copy={copy} cardClassName="border-b border-[#6b3e26]/20" priceClassName="mt-1 text-sm font-semibold text-[#6b3e26]" />
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
