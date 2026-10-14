import { normalizeQrColor, qrBlack, qrContrast, qrWhite, xmlText } from "./qr-palette";

export const qrStyles = ["classic", "rounded", "dots", "logo"] as const;
export type QrStyle = (typeof qrStyles)[number];

export type QrMatrix = {
  size: number;
  modules: boolean[];
};

export type QrDrawOptions = {
  dark: string;
  light: string;
  style: QrStyle;
  logoHref?: string | null;
};

const margin = 2;

export function qrStyleFromSearch(value: string | null): QrStyle {
  return qrStyles.includes(value as QrStyle) ? (value as QrStyle) : "classic";
}

export function qrDrawFromSearch(params: URLSearchParams): QrDrawOptions {
  const dark = normalizeQrColor(params.get("dark")) ?? qrBlack;
  const light = normalizeQrColor(params.get("light")) ?? qrWhite;
  const safe = qrContrast(dark, light) >= 4.5;
  return {
    dark: safe ? dark : qrBlack,
    light: safe ? light : qrWhite,
    style: qrStyleFromSearch(params.get("style")),
  };
}

export function paintQrSvg(matrix: QrMatrix, options: QrDrawOptions): string | null {
  if (!validMatrix(matrix) || !normalizeQrColor(options.dark) || !normalizeQrColor(options.light)) {
    return null;
  }

  const { size } = matrix;
  const full = size + margin * 2;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" shape-rendering="geometricPrecision">`,
    `<rect width="${full}" height="${full}" fill="${options.light}"/>`,
  ];

  if (options.style === "classic" || options.style === "logo") {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!moduleOn(matrix, row, col, options.style)) {
          continue;
        }
        parts.push(`<rect x="${col + margin}" y="${row + margin}" width="1" height="1" fill="${options.dark}"/>`);
      }
    }
  } else {
    for (const origin of finderOrigins(size)) {
      parts.push(finderMark(origin.col + margin, origin.row + margin, options.dark, options.light, options.style));
    }
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!moduleOn(matrix, row, col, "classic") || inFinder(size, row, col)) {
          continue;
        }
        const x = col + margin;
        const y = row + margin;
        parts.push(
          options.style === "dots"
            ? `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.34" fill="${options.dark}"/>`
            : `<rect x="${x + 0.12}" y="${y + 0.12}" width="0.76" height="0.76" rx="0.28" fill="${options.dark}"/>`,
        );
      }
    }
  }

  if (options.style === "logo") {
    const logo = safeLogoHref(options.logoHref);
    const box = logoBox(size);
    const x = box.x + margin;
    const y = box.y + margin;
    parts.push(`<rect x="${x - 0.35}" y="${y - 0.35}" width="${box.span + 0.7}" height="${box.span + 0.7}" rx="1.1" fill="${options.light}"/>`);
    if (logo) {
      const pad = 0.7;
      parts.push(
        `<image href="${xmlText(logo)}" x="${x + pad}" y="${y + pad}" width="${box.span - pad * 2}" height="${box.span - pad * 2}" preserveAspectRatio="xMidYMid slice"/>`,
      );
    }
  }

  parts.push("</svg>");
  const svg = parts.join("");
  if (svg.includes("<script") || svg.includes("javascript:")) {
    return null;
  }
  return svg;
}

export function moduleOn(matrix: QrMatrix, row: number, col: number, style: QrStyle): boolean {
  if (!matrix.modules[row * matrix.size + col]) {
    return false;
  }
  if (style !== "logo") {
    return true;
  }
  const box = logoBox(matrix.size);
  return row < box.y || row >= box.y + box.span || col < box.x || col >= box.x + box.span;
}

export function inFinder(size: number, row: number, col: number): boolean {
  return finderOrigins(size).some((origin) => row >= origin.row && row < origin.row + 7 && col >= origin.col && col < origin.col + 7);
}

function finderOrigins(size: number): { row: number; col: number }[] {
  return [
    { row: 0, col: 0 },
    { row: 0, col: size - 7 },
    { row: size - 7, col: 0 },
  ];
}

function finderMark(x: number, y: number, dark: string, light: string, style: QrStyle): string {
  const radius = style === "dots" ? 1.6 : 1.15;
  return [
    `<rect x="${x + 0.15}" y="${y + 0.15}" width="6.7" height="6.7" rx="${radius}" fill="${dark}"/>`,
    `<rect x="${x + 1.15}" y="${y + 1.15}" width="4.7" height="4.7" rx="${radius * 0.7}" fill="${light}"/>`,
    `<rect x="${x + 2.15}" y="${y + 2.15}" width="2.7" height="2.7" rx="${radius * 0.45}" fill="${dark}"/>`,
  ].join("");
}

function logoBox(size: number): { x: number; y: number; span: number } {
  const span = Math.max(7, Math.floor(size * 0.22));
  const start = Math.floor((size - span) / 2);
  return { x: start, y: start, span };
}

function validMatrix(matrix: QrMatrix): boolean {
  return matrix.size >= 21 && matrix.size <= 177 && matrix.modules.length === matrix.size * matrix.size;
}

function safeLogoHref(value: string | null | undefined): string | null {
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
