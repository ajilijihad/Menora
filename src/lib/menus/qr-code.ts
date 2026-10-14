import "server-only";

import { PNG } from "pngjs";
import QRCode from "qrcode";

import { posterSvg, qrBlack, qrWhite } from "./qr-palette";
import { inFinder, moduleOn, paintQrSvg, type QrDrawOptions, type QrMatrix } from "./qr-style";
import { canonicalMenuUrl } from "./public-url";

const qrOptions = {
  margin: 4,
  errorCorrectionLevel: "M",
} as const;

type QrPalette = { dark: string; light: string };

export function menuQrModules(url: string): QrMatrix | null {
  if (!canonicalUrlShape(url)) {
    return null;
  }

  const symbol = QRCode.create(url, { errorCorrectionLevel: "H" });
  const size = symbol.modules.size;
  const modules: boolean[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      modules.push(symbol.modules.get(row, col) === 1);
    }
  }
  return { size, modules };
}

export async function menuQrPng(url: string, palette: QrPalette = { dark: qrBlack, light: qrWhite }, style: QrDrawOptions["style"] = "classic"): Promise<Uint8Array | null> {
  const matrix = menuQrModules(url);
  if (!matrix) {
    return null;
  }

  return rasterQr(matrix, { ...palette, style });
}

export async function menuQrSvg(url: string, palette: QrPalette = { dark: qrBlack, light: qrWhite }): Promise<string | null> {
  if (!canonicalUrlShape(url)) {
    return null;
  }

  const svg = await QRCode.toString(url, { ...qrOptions, ...colorOptions(palette), type: "svg" });
  if (!svg.startsWith("<svg") || !svg.includes("</svg>") || svg.includes("<script") || svg.includes("javascript:")) {
    return null;
  }

  return svg;
}

export async function menuQrPosterSvg(url: string, title: string, instruction: string): Promise<string | null> {
  const qr = await menuQrSvg(url);
  if (!qr) {
    return null;
  }

  return posterSvg(qr, title, instruction, url);
}

function colorOptions(palette: QrPalette) {
  return { color: { dark: palette.dark, light: palette.light } };
}

export function menuQrStyledSvg(url: string, options: QrDrawOptions): string | null {
  const matrix = menuQrModules(url);
  if (!matrix) {
    return null;
  }
  return paintQrSvg(matrix, options);
}

function rasterQr(matrix: QrMatrix, options: QrDrawOptions): Uint8Array {
  const quiet = 4;
  const scale = 16;
  const cells = matrix.size + quiet * 2;
  const px = cells * scale;
  const png = new PNG({ width: px, height: px });
  const light = rgb(options.light);
  const dark = rgb(options.dark);
  fillRect(png, 0, 0, px, px, light);

  const dotStyle = options.style === "dots" || options.style === "rounded";
  if (dotStyle) {
    for (const origin of [
      { row: 0, col: 0 },
      { row: 0, col: matrix.size - 7 },
      { row: matrix.size - 7, col: 0 },
    ]) {
      const x = (origin.col + quiet) * scale;
      const y = (origin.row + quiet) * scale;
      fillRound(png, x + scale * 0.15, y + scale * 0.15, scale * 6.7, scale * 6.7, scale * 1.2, dark);
      fillRound(png, x + scale * 1.15, y + scale * 1.15, scale * 4.7, scale * 4.7, scale * 0.8, light);
      fillRound(png, x + scale * 2.15, y + scale * 2.15, scale * 2.7, scale * 2.7, scale * 0.5, dark);
    }
  }

  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!moduleOn(matrix, row, col, options.style === "logo" ? "logo" : "classic")) {
        continue;
      }
      if (dotStyle && inFinder(matrix.size, row, col)) {
        continue;
      }
      const x = (col + quiet) * scale;
      const y = (row + quiet) * scale;
      if (options.style === "dots") {
        fillCircle(png, x + scale / 2, y + scale / 2, scale * 0.34, dark);
      } else if (options.style === "rounded") {
        fillRound(png, x + scale * 0.12, y + scale * 0.12, scale * 0.76, scale * 0.76, scale * 0.28, dark);
      } else {
        fillRect(png, x, y, scale, scale, dark);
      }
    }
  }

  return new Uint8Array(PNG.sync.write(png));
}

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function fillRect(png: PNG, x: number, y: number, width: number, height: number, color: [number, number, number]) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(png.width, Math.ceil(x + width));
  const y1 = Math.min(png.height, Math.ceil(y + height));
  for (let row = y0; row < y1; row += 1) {
    for (let col = x0; col < x1; col += 1) {
      setPixel(png, col, row, color);
    }
  }
}

function fillCircle(png: PNG, cx: number, cy: number, radius: number, color: [number, number, number]) {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(png.width, Math.ceil(cx + radius));
  const y1 = Math.min(png.height, Math.ceil(cy + radius));
  for (let row = y0; row < y1; row += 1) {
    for (let col = x0; col < x1; col += 1) {
      if ((col + 0.5 - cx) ** 2 + (row + 0.5 - cy) ** 2 <= radius * radius) {
        setPixel(png, col, row, color);
      }
    }
  }
}

function fillRound(png: PNG, x: number, y: number, width: number, height: number, radius: number, color: [number, number, number]) {
  const r = Math.min(radius, width / 2, height / 2);
  fillRect(png, x + r, y, width - r * 2, height, color);
  fillRect(png, x, y + r, width, height - r * 2, color);
  fillCircle(png, x + r, y + r, r, color);
  fillCircle(png, x + width - r, y + r, r, color);
  fillCircle(png, x + r, y + height - r, r, color);
  fillCircle(png, x + width - r, y + height - r, r, color);
}

function setPixel(png: PNG, x: number, y: number, color: [number, number, number]) {
  const index = (png.width * y + x) << 2;
  png.data[index] = color[0];
  png.data[index + 1] = color[1];
  png.data[index + 2] = color[2];
  png.data[index + 3] = 255;
}

export function menuQrTarget(slug: string, appUrl: string, nodeEnv: string): string | null {
  return canonicalMenuUrl(slug, appUrl, nodeEnv);
}

function canonicalUrlShape(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
