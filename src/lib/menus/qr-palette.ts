export const qrBlack = "#000000";
export const qrWhite = "#FFFFFF";

const hexPattern = /^#[0-9A-F]{6}$/;

export const qrPresets = [
  { id: "classic", dark: qrBlack, light: qrWhite },
  { id: "navy", dark: "#15213B", light: qrWhite },
  { id: "darkOrange", dark: "#9A3412", light: qrWhite },
] as const;

export function normalizeQrColor(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const withHash = value.startsWith("#") ? value : `#${value}`;
  const color = withHash.toUpperCase();
  return hexPattern.test(color) ? color : null;
}

export function qrContrast(dark: string, light: string): number {
  const darker = luminance(dark);
  const lighter = luminance(light);
  const high = Math.max(darker, lighter);
  const low = Math.min(darker, lighter);
  return (high + 0.05) / (low + 0.05);
}

export function qrPaletteFromSearch(params: URLSearchParams): { dark: string; light: string } {
  const dark = normalizeQrColor(params.get("dark")) ?? qrBlack;
  const light = normalizeQrColor(params.get("light")) ?? qrWhite;
  if (qrContrast(dark, light) < 4.5) {
    return { dark: qrBlack, light: qrWhite };
  }

  return { dark, light };
}

export function xmlText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    if (character === "&") return "&amp;";
    if (character === "<") return "&lt;";
    if (character === ">") return "&gt;";
    if (character === '"') return "&quot;";
    return "&apos;";
  });
}

export const posterSizes = ["a5", "a6", "a7", "square", "letter"] as const;
export type PosterSizeId = (typeof posterSizes)[number];

export const posterPixels: Record<PosterSizeId, { width: number; height: number }> = {
  a5: { width: 559, height: 794 },
  a6: { width: 397, height: 559 },
  a7: { width: 280, height: 397 },
  square: { width: 794, height: 794 },
  letter: { width: 816, height: 1056 },
};

export const posterPageSize: Record<PosterSizeId, string> = {
  a5: "A5 portrait",
  a6: "105mm 148mm",
  a7: "74mm 105mm",
  square: "210mm 210mm",
  letter: "letter portrait",
};

export function posterSizeFromValue(value: unknown): PosterSizeId {
  return typeof value === "string" && posterSizes.includes(value as PosterSizeId) ? (value as PosterSizeId) : "a5";
}

export function posterSvg(
  qrSvg: string,
  title: string,
  instruction: string,
  url: string,
  extras?: { size?: PosterSizeId; backgroundHref?: string | null; logoHref?: string | null },
): string | null {
  if (!qrSvg.startsWith("<svg") || !qrSvg.includes("</svg>") || /<script|javascript:/i.test(qrSvg)) {
    return null;
  }

  const { width, height } = posterPixels[extras?.size ?? "a5"];
  const background = httpHref(extras?.backgroundHref);
  const logo = httpHref(extras?.logoHref);
  const panelWidth = Math.round(width * 0.78);
  const panelHeight = Math.round(height * 0.84);
  const panelX = Math.round((width - panelWidth) / 2);
  const panelY = Math.round((height - panelHeight) / 2);
  const shortSide = Math.min(width, height);
  const logoSize = logo ? Math.round(shortSide * 0.1) : 0;
  const titleSize = Math.max(18, Math.round(shortSide * 0.045));
  const scanSize = Math.max(14, Math.round(shortSide * 0.032));
  const urlSize = Math.max(12, Math.round(shortSide * 0.02));
  const gap = Math.round(shortSide * 0.028);
  const top = panelY + Math.round(panelHeight * 0.07);
  const titleY = top + logoSize + (logo ? gap : 0) + titleSize;
  const qrTop = titleY + gap;
  const qrRoom = panelY + panelHeight - (scanSize + urlSize + gap * 4) - qrTop;
  const qrSize = Math.max(80, Math.min(Math.round(panelWidth * 0.72), qrRoom));
  const qrX = Math.round((width - qrSize) / 2);
  const scanY = qrTop + qrSize + gap + scanSize;
  const urlY = scanY + gap + urlSize;
  const nested = qrSvg.replace("<svg ", `<svg x="${qrX}" y="${qrTop}" width="${qrSize}" height="${qrSize}" `);
  const parts = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#FFF7ED"/>`,
  ];
  if (background) {
    parts.push(`<image href="${xmlText(background)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`);
  }
  parts.push(`<rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="28" fill="#FFFFFF"/>`);
  if (logo) {
    const logoX = Math.round((width - logoSize) / 2);
    parts.push(`<clipPath id="poster-logo"><rect x="${logoX}" y="${top}" width="${logoSize}" height="${logoSize}" rx="16"/></clipPath>`);
    parts.push(`<image href="${xmlText(logo)}" x="${logoX}" y="${top}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#poster-logo)"/>`);
  }
  parts.push(
    `<text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="#111827">${xmlText(title)}</text>`,
    nested,
    `<text x="${width / 2}" y="${scanY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${scanSize}" font-weight="700" fill="#111827">${xmlText(instruction)}</text>`,
    `<text x="${width / 2}" y="${urlY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${urlSize}" fill="#334155">${xmlText(url)}</text>`,
    `</svg>`,
  );
  const svg = parts.join("");
  if (/<script|javascript:/i.test(svg)) {
    return null;
  }
  return svg;
}

function httpHref(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const scaled = channel / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}
