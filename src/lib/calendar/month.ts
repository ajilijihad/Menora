const dayPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDay(value: string): boolean {
  if (!dayPattern.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function weekStartsOn(locale: string): number {
  return locale.toLowerCase().startsWith("ar") ? 6 : 0;
}

export function shiftMonth(isoMonthStart: string, amount: number): string {
  const [year, month] = isoMonthStart.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${nextMonth}-01`;
}

export function monthOf(isoDay: string): string {
  return `${isoDay.slice(0, 7)}-01`;
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Six rows starting on the locale's first weekday. Values are YYYY-MM-DD. */
export function monthGrid(monthStart: string, weekStart: number): string[] {
  const [year, month] = monthStart.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const leading = (first.getUTCDay() - weekStart + 7) % 7;
  const gridStart = new Date(first);
  gridStart.setUTCDate(first.getUTCDate() - leading);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setUTCDate(gridStart.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

export function isWithinBounds(day: string, min?: string, max?: string): boolean {
  if (min && day < min) {
    return false;
  }
  if (max && day > max) {
    return false;
  }
  return true;
}
