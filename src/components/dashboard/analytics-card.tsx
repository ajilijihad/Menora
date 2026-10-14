import type { ReactNode } from "react";

import { Sparkline } from "./sparkline";

type AnalyticsCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon: ReactNode;
  tone: string;
  chart?: number[];
  trend?: string | null;
};

export function AnalyticsCard({ label, value, detail, icon, tone, chart, trend }: AnalyticsCardProps) {
  return (
    <article className="rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 place-items-center rounded-xl" style={{ backgroundColor: `${tone}1A`, color: tone }}>
          {icon}
        </span>
        {trend ? <span className="text-xs font-medium text-emerald-500">{trend}</span> : null}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
      {detail ? <p className="text-xs text-muted">{detail}</p> : null}
      {chart ? <Sparkline values={chart} color={tone} /> : null}
    </article>
  );
}
