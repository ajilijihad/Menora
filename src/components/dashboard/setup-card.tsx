import { Check } from "lucide-react";

import type { OverviewStepId } from "@/lib/dashboard/overview";
import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";
import { publishMenuAction } from "@/modules/businesses/actions";

type SetupCardProps = {
  copy: DashboardCopy;
  percent: number;
  steps: { id: OverviewStepId; done: boolean }[];
  publish?: { locale: string; businessId: string } | null;
};

export function SetupCard({ copy, percent, steps, publish = null }: SetupCardProps) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold">{copy.setupTitle}</h2>
        <div className="relative size-16 shrink-0">
          <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--line)" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-sm font-semibold">{percent}%</span>
        </div>
      </div>
      <ul className="mt-4 space-y-2.5">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2 text-sm">
            <span
              className={
                step.done
                  ? "grid size-5 place-items-center rounded-full bg-emerald-500 text-white"
                  : "grid size-5 place-items-center rounded-full border border-line text-muted"
              }
            >
              {step.done ? <Check className="size-3" /> : null}
            </span>
            {step.id === "publish" && !step.done && publish ? (
              <form action={publishMenuAction} className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="text-muted">{copy.checklist.publish}</span>
                <input type="hidden" name="locale" value={publish.locale} />
                <input type="hidden" name="businessId" value={publish.businessId} />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white"
                >
                  {copy.publishMenu}
                </button>
              </form>
            ) : (
              <span className={step.done ? "text-foreground" : "text-muted"}>{copy.checklist[step.id]}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
