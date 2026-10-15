export const categoryIcons = [
  "meal",
  "drink",
  "juice",
  "coffee",
  "water",
  "wine",
  "beer",
  "cocktail",
  "milk",
  "fish",
  "vegetable",
  "salad",
  "fruit",
  "dessert",
  "ice-cream",
  "cake",
  "bakery",
  "burger",
  "pizza",
  "chicken",
  "meat",
  "soup",
  "breakfast",
  "sandwich",
  "grill",
  "snack",
] as const;

export type CategoryIcon = (typeof categoryIcons)[number];

export function parseCategoryIcon(value: unknown): CategoryIcon | null {
  return categoryIcons.find((icon) => icon === value) ?? null;
}
