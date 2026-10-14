import { currencyExponent, formatMinor } from "@/lib/menus/money";

import type { Locale } from "./locales";

export function formatMoney(amount: number, currency: string, locale: Locale): string {
  const exponent = currencyExponent(currency);
  const plain = exponent === null ? "" : formatMinor(amount, exponent);
  if (!plain) {
    return "";
  }

  const major = Number(plain);
  if (!Number.isFinite(major)) {
    return "";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(major);
}

export function formatClock(value: string, locale: Locale): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    return "";
  }

  const date = new Date(Date.UTC(2020, 0, 1, Number(match[1]), Number(match[2])));
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date);
}
