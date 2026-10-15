import {
  Apple,
  Beef,
  Beer,
  Cake,
  Carrot,
  Citrus,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Dessert,
  Drumstick,
  Egg,
  Fish,
  Flame,
  GlassWater,
  Hamburger,
  IceCreamCone,
  Martini,
  Milk,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";

import type { CategoryIcon } from "@/lib/menus/category-icons";

const icons: Record<CategoryIcon, LucideIcon> = {
  meal: UtensilsCrossed,
  drink: CupSoda,
  juice: Citrus,
  coffee: Coffee,
  water: GlassWater,
  wine: Wine,
  beer: Beer,
  cocktail: Martini,
  milk: Milk,
  fish: Fish,
  vegetable: Carrot,
  salad: Salad,
  fruit: Apple,
  dessert: Dessert,
  "ice-cream": IceCreamCone,
  cake: Cake,
  bakery: Croissant,
  burger: Hamburger,
  pizza: Pizza,
  chicken: Drumstick,
  meat: Beef,
  soup: Soup,
  breakfast: Egg,
  sandwich: Sandwich,
  grill: Flame,
  snack: Cookie,
};

export function CategoryGlyph({
  icon,
  imageUrl,
  className,
  imageClassName,
}: {
  icon: CategoryIcon | null;
  imageUrl: string | null;
  className?: string;
  imageClassName?: string;
}) {
  if (imageUrl) {
    return (
      // Category pictures can be a local preview or a stored menu image.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className={imageClassName ?? className} />
    );
  }

  const Icon = icon ? icons[icon] : null;
  if (!Icon) {
    return null;
  }

  return <Icon className={className} aria-hidden="true" />;
}
