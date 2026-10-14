import type { CSSProperties } from "react";

export const menuThemes = ["modern-dark", "clean-light", "premium-gold", "fresh-green", "traditional-beige"] as const;
export type MenuTheme = (typeof menuThemes)[number];

const legacyThemes = {
  restaurant: "modern-dark",
  cafe: "clean-light",
  minimal: "premium-gold",
} as const;

export const fontChoices = ["sans", "serif", "mono"] as const;
export const typeScales = ["sm", "md", "lg"] as const;
export const cardLayouts = ["stacked", "horizontal", "overlay"] as const;
export const imageRatios = ["square", "landscape", "portrait"] as const;
export const spacingSteps = ["compact", "comfortable", "spacious"] as const;
export const navStyles = ["pills", "underline", "list"] as const;
export const featuredStyles = ["row", "grid", "list"] as const;

export type FontChoice = (typeof fontChoices)[number];
export type TypeScale = (typeof typeScales)[number];
export type CardLayout = (typeof cardLayouts)[number];
export type ImageRatio = (typeof imageRatios)[number];
export type SpacingStep = (typeof spacingSteps)[number];
export type NavStyle = (typeof navStyles)[number];
export type FeaturedStyle = (typeof featuredStyles)[number];

export type MenuAppearance = {
  theme: MenuTheme;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  font: FontChoice;
  typeScale: TypeScale;
  cardLayout: CardLayout;
  imageRatio: ImageRatio;
  radius: number;
  spacing: SpacingStep;
  navStyle: NavStyle;
  featuredStyle: FeaturedStyle;
};

const hexPattern = /^#[0-9A-Fa-f]{6}$/;

const themeDefaults: Record<MenuTheme, MenuAppearance> = {
  "modern-dark": {
    theme: "modern-dark",
    primary: "#ff7a1a",
    secondary: "#ffb020",
    background: "#0c0c0e",
    text: "#f5f5f4",
    font: "sans",
    typeScale: "md",
    cardLayout: "horizontal",
    imageRatio: "square",
    radius: 18,
    spacing: "compact",
    navStyle: "pills",
    featuredStyle: "list",
  },
  "clean-light": {
    theme: "clean-light",
    primary: "#ff7a1a",
    secondary: "#ff9a4a",
    background: "#fffaf6",
    text: "#1c1917",
    font: "sans",
    typeScale: "md",
    cardLayout: "stacked",
    imageRatio: "landscape",
    radius: 22,
    spacing: "comfortable",
    navStyle: "pills",
    featuredStyle: "grid",
  },
  "premium-gold": {
    theme: "premium-gold",
    primary: "#d4af37",
    secondary: "#f3e5ab",
    background: "#070707",
    text: "#f6f1e4",
    font: "serif",
    typeScale: "lg",
    cardLayout: "horizontal",
    imageRatio: "landscape",
    radius: 16,
    spacing: "comfortable",
    navStyle: "pills",
    featuredStyle: "row",
  },
  "fresh-green": {
    theme: "fresh-green",
    primary: "#3f6b4a",
    secondary: "#7d9a72",
    background: "#f6f3ea",
    text: "#1e2a22",
    font: "sans",
    typeScale: "md",
    cardLayout: "stacked",
    imageRatio: "square",
    radius: 24,
    spacing: "comfortable",
    navStyle: "pills",
    featuredStyle: "grid",
  },
  "traditional-beige": {
    theme: "traditional-beige",
    primary: "#6b3e26",
    secondary: "#a56b45",
    background: "#f4e7d2",
    text: "#3b2415",
    font: "serif",
    typeScale: "md",
    cardLayout: "horizontal",
    imageRatio: "square",
    radius: 16,
    spacing: "compact",
    navStyle: "pills",
    featuredStyle: "list",
  },
};

export function defaultAppearance(theme: MenuTheme = "modern-dark"): MenuAppearance {
  return { ...themeDefaults[theme] };
}

export function normalizeMenuTheme(value: unknown): MenuTheme | null {
  if (typeof value !== "string") {
    return null;
  }

  const mapped = value in legacyThemes ? legacyThemes[value as keyof typeof legacyThemes] : value;
  return menuThemes.find((theme) => theme === mapped) ?? null;
}

export function parseAppearance(input: unknown): MenuAppearance | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const source = input as Record<string, unknown>;
  const theme = normalizeMenuTheme(source.theme);
  if (!theme) {
    return null;
  }

  const primary = hex(source.primary);
  const secondary = hex(source.secondary);
  const background = hex(source.background);
  const text = hex(source.text);
  const font = oneOf(fontChoices, source.font);
  const typeScale = oneOf(typeScales, source.typeScale);
  const cardLayout = oneOf(cardLayouts, source.cardLayout);
  const imageRatio = oneOf(imageRatios, source.imageRatio);
  const spacing = oneOf(spacingSteps, source.spacing);
  const navStyle = oneOf(navStyles, source.navStyle);
  const featuredStyle = oneOf(featuredStyles, source.featuredStyle);
  const radius = radiusPx(source.radius);

  if (
    !primary ||
    !secondary ||
    !background ||
    !text ||
    !font ||
    !typeScale ||
    !cardLayout ||
    !imageRatio ||
    !spacing ||
    !navStyle ||
    !featuredStyle ||
    radius === null
  ) {
    return null;
  }

  return {
    theme,
    primary,
    secondary,
    background,
    text,
    font,
    typeScale,
    cardLayout,
    imageRatio,
    radius,
    spacing,
    navStyle,
    featuredStyle,
  };
}

export function appearanceFromRow(
  theme: string | null | undefined,
  row: {
    primary_color?: unknown;
    accent_color?: unknown;
    background_color?: unknown;
    text_color?: unknown;
    font_choice?: unknown;
    type_scale?: unknown;
    card_layout?: unknown;
    image_ratio?: unknown;
    radius_px?: unknown;
    spacing_step?: unknown;
    nav_style?: unknown;
    featured_style?: unknown;
    menu_theme?: unknown;
  } | null,
): MenuAppearance {
  const chosen = normalizeMenuTheme(row?.menu_theme) ?? normalizeMenuTheme(theme) ?? "modern-dark";
  const parsed = parseAppearance({
    theme: chosen,
    primary: row?.primary_color ?? defaultAppearance(chosen).primary,
    secondary: row?.accent_color ?? defaultAppearance(chosen).secondary,
    background: row?.background_color ?? defaultAppearance(chosen).background,
    text: row?.text_color ?? defaultAppearance(chosen).text,
    font: row?.font_choice ?? defaultAppearance(chosen).font,
    typeScale: row?.type_scale ?? defaultAppearance(chosen).typeScale,
    cardLayout: row?.card_layout ?? defaultAppearance(chosen).cardLayout,
    imageRatio: row?.image_ratio ?? defaultAppearance(chosen).imageRatio,
    radius: row?.radius_px ?? defaultAppearance(chosen).radius,
    spacing: row?.spacing_step ?? defaultAppearance(chosen).spacing,
    navStyle: row?.nav_style ?? defaultAppearance(chosen).navStyle,
    featuredStyle: row?.featured_style ?? defaultAppearance(chosen).featuredStyle,
  });

  return parsed ?? defaultAppearance(chosen);
}

export function appearanceRecord(appearance: MenuAppearance) {
  return {
    menu_theme: appearance.theme,
    primary_color: appearance.primary,
    accent_color: appearance.secondary,
    background_color: appearance.background,
    text_color: appearance.text,
    font_choice: appearance.font,
    type_scale: appearance.typeScale,
    card_layout: appearance.cardLayout,
    image_ratio: appearance.imageRatio,
    radius_px: appearance.radius,
    spacing_step: appearance.spacing,
    nav_style: appearance.navStyle,
    featured_style: appearance.featuredStyle,
  };
}

export function appearanceStyle(appearance: MenuAppearance): CSSProperties {
  return {
    backgroundColor: appearance.background,
    color: appearance.text,
    fontFamily: fontStack(appearance.font),
    fontSize: bodySize(appearance.typeScale),
    ["--menu-primary" as string]: appearance.primary,
    ["--menu-secondary" as string]: appearance.secondary,
    ["--menu-bg" as string]: appearance.background,
    ["--menu-text" as string]: appearance.text,
    ["--menu-on-primary" as string]: readableOn(appearance.primary),
    ["--menu-radius" as string]: `${appearance.radius}px`,
    ["--menu-space" as string]: spaceSize(appearance.spacing),
    ["--menu-title" as string]: titleSize(appearance.typeScale),
  };
}

export function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

export function featuredListClass(style: FeaturedStyle): string {
  if (style === "grid") {
    return "mt-4 grid grid-cols-2 gap-4";
  }

  if (style === "list") {
    return "mt-4 flex flex-col gap-3";
  }

  return "mt-4 flex snap-x gap-4 overflow-x-auto pb-2";
}

export function featuredItemClass(style: FeaturedStyle): string {
  return style === "row" ? "w-72 shrink-0 snap-start" : "min-w-0";
}

export function imageFrameClass(ratio: ImageRatio): string {
  if (ratio === "square") {
    return "aspect-square w-full object-cover";
  }

  if (ratio === "portrait") {
    return "aspect-[3/4] w-full object-cover";
  }

  return "aspect-[4/3] w-full object-cover";
}

export function cardFrameClass(layout: CardLayout): string {
  const radius = "overflow-hidden rounded-[var(--menu-radius)] bg-[var(--menu-bg)]";
  if (layout === "horizontal") {
    return `${radius} grid grid-cols-1 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]`;
  }

  if (layout === "overlay") {
    return `${radius} relative min-h-48`;
  }

  return `${radius} flex h-full flex-col`;
}

export function navListClass(style: NavStyle): string {
  if (style === "list") {
    return "flex flex-col gap-1";
  }

  return "flex gap-2 overflow-x-auto";
}

export function navLinkClass(style: NavStyle): string {
  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--menu-secondary)]";
  if (style === "underline") {
    return `inline-flex h-10 items-center border-b-2 px-1 text-sm font-medium ${focus}`;
  }

  if (style === "list") {
    return `block rounded-sm px-1 py-1 text-sm underline-offset-4 hover:underline ${focus}`;
  }

  return `inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${focus}`;
}

export function navLinkStyle(style: NavStyle, surface: "page" | "inverse" = "page"): CSSProperties {
  const mark = surface === "inverse" ? "var(--menu-on-primary)" : "var(--menu-primary)";
  const ink = surface === "inverse" ? "var(--menu-primary)" : "var(--menu-on-primary)";
  if (style === "underline") {
    return { borderColor: mark };
  }

  if (style === "list") {
    return {};
  }

  return { backgroundColor: mark, color: ink };
}

function fontStack(font: FontChoice): string {
  const arabic = "var(--font-noto-arabic)";
  if (font === "serif") {
    return `Georgia, "Times New Roman", ${arabic}, serif`;
  }

  if (font === "mono") {
    return `var(--font-geist-mono), ui-monospace, ${arabic}, monospace`;
  }

  return `var(--font-geist-sans), ${arabic}, sans-serif`;
}

function bodySize(scale: TypeScale): string {
  if (scale === "sm") {
    return "0.875rem";
  }

  if (scale === "lg") {
    return "1.125rem";
  }

  return "1rem";
}

function titleSize(scale: TypeScale): string {
  if (scale === "sm") {
    return "1.75rem";
  }

  if (scale === "lg") {
    return "3rem";
  }

  return "2.25rem";
}

function spaceSize(spacing: SpacingStep): string {
  if (spacing === "compact") {
    return "0.75rem";
  }

  if (spacing === "spacious") {
    return "2rem";
  }

  return "1.25rem";
}

function hex(value: unknown): string | null {
  if (typeof value !== "string" || !hexPattern.test(value)) {
    return null;
  }

  return value.toLowerCase();
}

function oneOf<T extends string>(options: readonly T[], value: unknown): T | null {
  return options.find((option) => option === value) ?? null;
}

function radiusPx(value: unknown): number | null {
  const number = typeof value === "number" ? value : typeof value === "string" && /^\d{1,2}$/.test(value) ? Number(value) : null;
  if (number === null || !Number.isInteger(number) || number < 0 || number > 32) {
    return null;
  }

  return number;
}

function readableOn(color: string): string {
  return contrastRatio(color, "#FFFFFF") >= 4.5 ? "#FFFFFF" : "#111111";
}

function luminance(color: string): number {
  const channels = [1, 3, 5].map((index) => {
    const value = Number.parseInt(color.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
