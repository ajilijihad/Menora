"use client";

import { useState } from "react";

type ChartDay = { day: string; menu: number; product: number };

const menuColor = "#FF5A24";
const productColor = "#8B5CF6";

export function DailyChart({
  days,
  menuLabel,
  productLabel,
  locale,
}: {
  days: ChartDay[];
  menuLabel: string;
  productLabel: string;
  locale: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const height = 260;
  const pad = { top: 16, right: 16, bottom: 36, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const peak = Math.max(1, ...days.map((day) => Math.max(day.menu, day.product)));
  const yMax = niceMax(peak);
  const ticks = yTicks(yMax);
  const xAt = (index: number) => (days.length <= 1 ? pad.left + innerW / 2 : pad.left + (index / (days.length - 1)) * innerW);
  const yAt = (value: number) => pad.top + innerH - (value / yMax) * innerH;
  const menuPath = linePath(days, "menu", xAt, yAt);
  const productPath = linePath(days, "product", xAt, yAt);
  const menuArea = `${menuPath} L ${xAt(days.length - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`;
  const labelIndexes = axisIndexes(days.length);
  const active = hover === null ? null : days[hover];
  const formatCount = new Intl.NumberFormat(locale).format;

  return (
    <div dir="ltr" className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: menuColor }} />
          {menuLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: productColor }} />
          {productLabel}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full"
        role="img"
        aria-label={`${menuLabel}, ${productLabel}`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={yAt(tick)} y2={yAt(tick)} className="stroke-line" strokeDasharray="3 4" />
            <text x={pad.left - 8} y={yAt(tick) + 4} textAnchor="end" className="fill-muted text-[11px]">
              {formatCount(tick)}
            </text>
          </g>
        ))}
        <path d={menuArea} fill={menuColor} opacity="0.16" />
        <path d={menuPath} fill="none" stroke={menuColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={productPath} fill="none" stroke={productColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {days.length <= 31
          ? days.map((day, index) => (
              <g key={day.day}>
                <circle cx={xAt(index)} cy={yAt(day.menu)} r="3" fill={menuColor} />
                <circle cx={xAt(index)} cy={yAt(day.product)} r="3" fill={productColor} />
              </g>
            ))
          : null}
        {labelIndexes.map((index) => (
          <text key={days[index]?.day ?? index} x={xAt(index)} y={height - 8} textAnchor="middle" className="fill-muted text-[11px]">
            {formatAxisDay(days[index]?.day ?? "", locale)}
          </text>
        ))}
        {days.map((day, index) => (
          <rect
            key={`${day.day}-hit`}
            x={xAt(index) - innerW / Math.max(days.length, 1) / 2}
            y={pad.top}
            width={innerW / Math.max(days.length, 1)}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(index)}
          />
        ))}
        {hover !== null ? (
          <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.top} y2={pad.top + innerH} className="stroke-muted" strokeDasharray="3 3" />
        ) : null}
      </svg>
      {active && hover !== null ? (
        <div
          className="pointer-events-none absolute top-10 z-10 min-w-36 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]"
          style={{ left: `clamp(0.5rem, ${(xAt(hover) / width) * 100}%, calc(100% - 9rem))` }}
        >
          <p className="font-medium">{formatFullDay(active.day, locale)}</p>
          <p className="mt-1 text-muted">
            <span className="me-1 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: menuColor }} />
            {menuLabel}: {formatCount(active.menu)}
          </p>
          <p className="text-muted">
            <span className="me-1 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: productColor }} />
            {productLabel}: {formatCount(active.product)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function linePath(days: ChartDay[], key: "menu" | "product", xAt: (index: number) => number, yAt: (value: number) => number): string {
  return days.map((day, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(day[key])}`).join(" ");
}

function niceMax(value: number): number {
  if (value <= 4) {
    return value;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function yTicks(max: number): number[] {
  if (max <= 1) {
    return [0, 1];
  }

  const middle = Math.round(max / 2);
  return middle === 0 || middle === max ? [0, max] : [0, middle, max];
}

function axisIndexes(length: number): number[] {
  if (length <= 1) {
    return [0];
  }

  if (length <= 8) {
    return Array.from({ length }, (_, index) => index);
  }

  const marks = 5;
  return Array.from({ length: marks }, (_, index) => Math.round((index / (marks - 1)) * (length - 1)));
}

function formatAxisDay(day: string, locale: string): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return day;
  }

  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function formatFullDay(day: string, locale: string): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return day;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
