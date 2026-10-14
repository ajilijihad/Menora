import Link from "next/link";

type MenuTab = "categories" | "products";

type MenuTabsProps = {
  active: MenuTab;
  categoriesLabel: string;
  productsLabel: string;
  categoriesHref: string;
  productsHref: string;
};

export function MenuTabs({ active, categoriesLabel, productsLabel, categoriesHref, productsHref }: MenuTabsProps) {
  return (
    <div className="flex gap-6 border-b border-line text-sm font-medium" role="tablist">
      <Link href={categoriesHref} role="tab" aria-selected={active === "categories"} className={tabClass(active === "categories")}>
        {categoriesLabel}
      </Link>
      <Link href={productsHref} role="tab" aria-selected={active === "products"} className={tabClass(active === "products")}>
        {productsLabel}
      </Link>
    </div>
  );
}

function tabClass(selected: boolean) {
  return `border-b-2 pb-2 ${selected ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"}`;
}
