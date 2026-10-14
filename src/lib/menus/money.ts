/**
 * Prices are integer counts of the currency's minor unit.
 * Multiplication below uses only those integers. A value such as 10.50 USD
 * is stored as 1050, never as a binary floating-point amount.
 */
export const currencies = [
  { code: "USD", exponent: 2 },
  { code: "EUR", exponent: 2 },
  { code: "GBP", exponent: 2 },
  { code: "SAR", exponent: 2 },
  { code: "AED", exponent: 2 },
  { code: "EGP", exponent: 2 },
  { code: "QAR", exponent: 2 },
  { code: "JOD", exponent: 3 },
  { code: "KWD", exponent: 3 },
  { code: "BHD", exponent: 3 },
  { code: "OMR", exponent: 3 },
  { code: "JPY", exponent: 0 },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];

const maxMinorUnits = 2_000_000_000;

export function currencyExponent(code: string): number | null {
  return currencies.find((currency) => currency.code === code)?.exponent ?? null;
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return currencyExponent(value) !== null;
}

function scaleFor(exponent: number): number {
  let scale = 1;
  for (let index = 0; index < exponent; index += 1) {
    scale *= 10;
  }
  return scale;
}

export function minorUnits(input: string, exponent: number): number | null {
  const value = input.trim();
  if (!/^\d{1,9}(?:\.\d{0,3})?$/.test(value)) {
    return null;
  }

  const [wholeText, fractionText = ""] = value.split(".");
  if (fractionText.length > exponent) {
    return null;
  }

  const whole = Number(wholeText);
  const fraction = Number(fractionText.padEnd(exponent, "0") || "0");
  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(fraction)) {
    return null;
  }

  const scale = scaleFor(exponent);
  const amount = whole * scale + fraction;
  if (!Number.isSafeInteger(amount) || amount > maxMinorUnits) {
    return null;
  }

  return amount;
}

export function formatMinor(amount: number, exponent: number): string {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    return "";
  }

  const scale = scaleFor(exponent);
  const whole = Math.trunc(amount / scale);
  if (exponent === 0) {
    return String(whole);
  }

  const fraction = String(amount % scale).padStart(exponent, "0");
  return `${whole}.${fraction}`;
}
