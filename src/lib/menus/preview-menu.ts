import { defaultAppearance, type MenuAppearance } from "./appearance";
import type { PublicMenu, PublicProduct } from "./public-menu";

export function previewMenu(
  menu: PublicMenu,
  appearance: MenuAppearance,
  images: { logoUrl: string | null; coverUrl: string | null },
): PublicMenu {
  return {
    ...menu,
    theme: appearance.theme,
    appearance,
    logoUrl: images.logoUrl,
    coverUrl: images.coverUrl,
  };
}

export function withSampleDishes(menu: PublicMenu, categoryName: string, dishName: string): PublicMenu {
  if (menu.categories.length > 0) {
    return menu;
  }

  const first = sampleProduct("sample-dish-1", dishName, true);
  const second = sampleProduct("sample-dish-2", dishName, false);
  return {
    ...menu,
    categories: [
      {
        id: "sample-category",
        name: categoryName,
        nameAr: categoryName,
        description: null,
        descriptionAr: null,
        products: [first, second],
      },
    ],
    featured: [first],
  };
}

function sampleProduct(id: string, name: string, featured: boolean): PublicProduct {
  return {
    id,
    categoryId: "sample-category",
    name,
    nameAr: name,
    description: null,
    descriptionAr: null,
    priceMinor: 1200,
    compareMinor: null,
    priceLabel: "12.00",
    compareAtLabel: null,
    imageUrls: [],
    unavailable: false,
    featured,
    labels: [],
    variants: [],
    addons: [],
  };
}

export function restoredAppearance(theme: MenuAppearance["theme"]): MenuAppearance {
  return defaultAppearance(theme);
}
