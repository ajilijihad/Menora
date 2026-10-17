import { Info, Layers, Package, QrCode, Users, type LucideIcon } from "lucide-react";

import type { Locale } from "@/lib/i18n/locales";

type BusinessStatsProps = {
  locale: Locale;
  users: number | null;
  scans: number | null;
  categories: number | null;
  products: number | null;
  usersLabel: string;
  scansLabel: string;
  categoriesLabel: string;
  productsLabel: string;
  usersHint: string;
  scansHint: string;
  categoriesHint: string;
  productsHint: string;
  unavailableLabel: string;
};

const cards: Array<{
  key: "users" | "scans" | "categories" | "products";
  icon: LucideIcon;
  card: string;
  iconWrap: string;
}> = [
  {
    key: "users",
    icon: Users,
    card: "bg-orange-50 dark:bg-orange-950/25",
    iconWrap: "bg-orange-100 text-orange-500 dark:bg-orange-950/60 dark:text-orange-300",
  },
  {
    key: "scans",
    icon: QrCode,
    card: "bg-sky-50 dark:bg-sky-950/25",
    iconWrap: "bg-sky-100 text-sky-500 dark:bg-sky-950/60 dark:text-sky-300",
  },
  {
    key: "categories",
    icon: Layers,
    card: "bg-violet-50 dark:bg-violet-950/25",
    iconWrap: "bg-violet-100 text-violet-500 dark:bg-violet-950/60 dark:text-violet-300",
  },
  {
    key: "products",
    icon: Package,
    card: "bg-emerald-50 dark:bg-emerald-950/25",
    iconWrap: "bg-emerald-100 text-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
];

export function BusinessStats(props: BusinessStatsProps) {
  const format = new Intl.NumberFormat(props.locale === "ar" ? "ar" : "en", { numberingSystem: "latn" });
  const copy = {
    users: { label: props.usersLabel, hint: props.usersHint, value: props.users },
    scans: { label: props.scansLabel, hint: props.scansHint, value: props.scans },
    categories: { label: props.categoriesLabel, hint: props.categoriesHint, value: props.categories },
    products: { label: props.productsLabel, hint: props.productsHint, value: props.products },
  };

  return (
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => {
        const item = copy[card.key];
        const Icon = card.icon;
        const shown = item.value === null ? props.unavailableLabel : format.format(item.value);
        return (
          <div key={card.key} className={`rounded-2xl border border-line px-3 py-3 shadow-[var(--shadow-card)] ${card.card}`}>
            <div className="flex items-center gap-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${card.iconWrap}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="flex items-center gap-1 text-xs font-medium text-muted">
                  <span className="truncate">{item.label}</span>
                  <span title={item.hint} className="inline-flex shrink-0 text-muted/80">
                    <Info className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">{item.hint}</span>
                  </span>
                </dt>
                <dd className="text-2xl font-semibold tracking-tight tabular-nums">{shown}</dd>
              </div>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
