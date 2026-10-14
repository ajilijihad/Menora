"use client";

import { useState } from "react";

import { signedAdminMoney } from "@/lib/admin/overview";

const colors = ["#FF5A24", "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"];

export function RevenueChart({
  days,
  series,
  locale,
  collectedLabel,
  refundedLabel,
}: {
  days: string[];
  series: Array<{ currency: string; collected: number[] }>;
  locale: string;
  collectedLabel: string;
  refundedLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const height = 260;
  const pad = { top: 16, right: 16, bottom: 36, left: 72 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const peak = Math.max(1, ...series.flatMap((line) => line.collected));
  const yMax = niceMax(peak);
  const ticks = yTicks(yMax);
  const xAt = (index: number) => (days.length <= 1 ? pad.left + innerW / 2 : pad.left + (index / (days.length - 1)) * innerW);
  const yAt = (value: number) => pad.top + innerH - (value / yMax) * innerH;
  const active = hover === null ? null : hover;
  const currency = series.length === 1 ? series[0]?.currency ?? "" : "";

  return (
    <div dir="ltr" className="relative">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
        {series.map((line, index) => (
          <span key={line.currency} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            {line.currency}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label={collectedLabel} onMouseLeave={() => setHover(null)}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={yAt(tick)} y2={yAt(tick)} className="stroke-line" strokeDasharray="3 4" />
            <text x={pad.left - 8} y={yAt(tick) + 4} textAnchor="end" className="fill-muted text-[11px]">
              {currency ? signedAdminMoney(tick, currency, locale) : tick}
            </text>
          </g>
        ))}
        {series.map((line, index) => (
          <path
            key={line.currency}
            d={linePath(line.collected, xAt, yAt)}
            fill="none"
            stroke={colors[index % colors.length]}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {days.map((day, index) => (
          <rect
            key={day}
            x={xAt(index) - innerW / Math.max(days.length, 1) / 2}
            y={pad.top}
            width={innerW / Math.max(days.length, 1)}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(index)}
          />
        ))}
        {labelIndexes(days.length).map((index) => (
          <text key={days[index]} x={xAt(index)} y={height - 8} textAnchor="middle" className="fill-muted text-[11px]">
            {formatAxisDay(days[index] ?? "", locale)}
          </text>
        ))}
      </svg>
      {active !== null && days[active] ? (
        <div className="absolute start-16 top-10 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
          <p className="font-medium text-foreground">{formatAxisDay(days[active], locale)}</p>
          {series.map((line) => (
            <p key={line.currency} className="mt-1 text-muted">
              {collectedLabel}: {signedAdminMoney(line.collected[active] ?? 0, line.currency, locale)}
            </p>
          ))}
          <span className="sr-only">{refundedLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

function linePath(values: number[], xAt: (index: number) => number, yAt: (value: number) => number): string {
  return values.map((value, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(value)}`).join(" ");
}

function niceMax(peak: number): number {
  const step = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil(peak / step) * step;
}

function yTicks(max: number): number[] {
  return [0, Math.round(max / 2), max];
}

function labelIndexes(length: number): number[] {
  if (length <= 1) {
    return [0];
  }
  const count = Math.min(6, length);
  return Array.from({ length: count }, (_, index) => Math.round((index * (length - 1)) / (count - 1)));
}

function formatAxisDay(day: string, locale: string): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return day;
  }
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}
