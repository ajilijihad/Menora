import { productName } from "./menu-details";
import { BrandMark, CategoryMark, CategoryScroller, FeaturedDishes, MenuDrawer, MenuProducts, MenuStatus, ProductPhoto, heroSource, themeStyle, type ThemeProps } from "./theme-parts";

export function PremiumGoldMenu({ menu, locale, copy, query, search, language }: ThemeProps) {
  const hero = heroSource(menu);

  return (
    <div data-public-menu="" className="min-h-dvh" style={themeStyle(menu.appearance, "dark")}>
      <a href="#menu-content" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-black focus:px-4 focus:py-2">{copy.skipToMenu}</a>
      <header>
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <MenuDrawer copy={copy} menu={menu} locale={locale} search={search} buttonClassName="grid size-10 place-items-center rounded-full border border-[var(--menu-primary)]/40 text-[var(--menu-primary)]" />
          <BrandMark menu={menu} className="flex min-w-0 items-center gap-2 text-[var(--menu-primary)]" imageClassName="size-9 rounded-full object-cover ring-1 ring-[var(--menu-primary)]" />
          <div className="rounded-full border border-[var(--menu-primary)]/40 px-3 py-1 text-xs text-[var(--menu-primary)]">{language}</div>
        </div>
        <div className="relative mx-4 min-h-80 overflow-hidden border border-[var(--menu-primary)]/30 sm:mx-6 sm:min-h-[28rem]" style={{ borderRadius: "var(--menu-radius)" }}>
          <ProductPhoto src={hero} alt="" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-center sm:p-10">
            <p className="text-xs tracking-[0.35em] text-[var(--menu-primary)]">◆</p>
            <h1 dir="auto" className="mt-2 font-serif text-[var(--menu-secondary)]" style={{ fontSize: "var(--menu-title)" }}>{menu.name}</h1>
            {menu.description ? <p dir="auto" className="mx-auto mt-3 max-w-lg text-sm text-white/80">{menu.description}</p> : null}
          </div>
        </div>
      </header>
      <CategoryScroller
        categories={menu.categories}
        locale={locale}
        copy={copy}
        navStyle={menu.appearance.navStyle}
        className="sticky top-0 z-10 bg-[var(--menu-bg)]/95 backdrop-blur"
        itemClassName={(active) => (active ? "text-black" : "border border-white/15 text-[var(--menu-secondary)]")}
      />
      <main id="menu-content" className="mx-auto w-full max-w-6xl pb-16">
        <MenuStatus menu={menu} copy={copy} query={query} />
        <FeaturedDishes menu={menu} locale={locale} copy={copy} cardClassName="border border-[var(--menu-primary)]/25 bg-white/[0.03]" priceClassName="mt-2 text-sm text-[var(--menu-primary)]" />
        {menu.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24 px-4 sm:px-6" style={{ paddingBlock: "var(--menu-space)" }}>
            <div className="mb-4 h-px bg-gradient-to-r from-transparent via-[var(--menu-primary)] to-transparent" />
            <h2 dir="auto" className="mb-4 flex items-center justify-center gap-2 text-center font-serif text-xl text-[var(--menu-secondary)]"><CategoryMark category={category} />{productName(locale, category)}</h2>
            <MenuProducts products={category.products} menu={menu} locale={locale} copy={copy} cardClassName="border border-[var(--menu-primary)]/20" priceClassName="mt-2 text-sm text-[var(--menu-primary)]" />
          </section>
        ))}
      </main>
    </div>
  );
}
