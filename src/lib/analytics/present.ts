const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

export function periodChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0 || current < 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export function inclusiveDays(from: string, to: string): number {
  if (!dayPattern.test(from) || !dayPattern.test(to) || from > to) {
    return 0;
  }

  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  return Math.round((end - start) / 86400000) + 1;
}

export function previousWindow(from: string, to: string): { from: string; to: string } | null {
  const span = inclusiveDays(from, to);
  if (span < 1) {
    return null;
  }

  const start = Date.parse(`${from}T00:00:00.000Z`);
  const prevEnd = start - 86400000;
  const prevStart = prevEnd - (span - 1) * 86400000;
  return {
    from: new Date(prevStart).toISOString().slice(0, 10),
    to: new Date(prevEnd).toISOString().slice(0, 10),
  };
}

export function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function sharePercent(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0 || part <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}
