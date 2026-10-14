import {
  Check,
  Clock,
  FileText,
  ImageIcon,
  Map as MapIcon,
  MapPin,
  Phone,
  Share2,
  Store,
  Target,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { setupPercent, setupProgress, type SetupSnapshot, type SetupStepId } from "@/lib/businesses/progress";
import type { BusinessCopy } from "@/lib/i18n/business-copy";

const displayOrder: SetupStepId[] = ["description", "address", "hours", "cover", "phone", "map", "logo", "social"];

const stepIcon: Record<SetupStepId, LucideIcon> = {
  description: FileText,
  address: MapPin,
  hours: Clock,
  cover: ImageIcon,
  phone: Phone,
  map: MapIcon,
  logo: Store,
  social: Share2,
};

const stepTone: Record<SetupStepId, string> = {
  description: "bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-300",
  address: "bg-sky-50 text-sky-500 dark:bg-sky-950/40 dark:text-sky-300",
  hours: "bg-violet-50 text-violet-500 dark:bg-violet-950/40 dark:text-violet-300",
  cover: "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300",
  phone: "bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-300",
  map: "bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-300",
  logo: "bg-violet-50 text-violet-500 dark:bg-violet-950/40 dark:text-violet-300",
  social: "bg-pink-50 text-pink-500 dark:bg-pink-950/40 dark:text-pink-300",
};

const stepAnchor: Record<SetupStepId, string> = {
  description: "business-info",
  address: "business-info",
  phone: "business-info",
  map: "business-info",
  hours: "opening-hours",
  cover: "media",
  logo: "media",
  social: "social-links",
};

type SetupProgressProps = {
  copy: BusinessCopy;
  business: SetupSnapshot;
  hint: string;
  completedLabel: string;
  allDoneLabel: string;
  remainingLabel: string;
  settingsHref?: string;
};

export function SetupProgress({ copy, business, hint, completedLabel, allDoneLabel, remainingLabel, settingsHref }: SetupProgressProps) {
  const byId = new Map(setupProgress(business).map((step) => [step.id, step]));
  const steps = displayOrder.map((id) => byId.get(id) ?? { id, done: false });
  const percent = setupPercent(steps);
  const remaining = steps.filter((step) => !step.done).length;

  return (
    <section className="rounded-3xl border border-orange-100 bg-orange-50/40 p-4 shadow-[var(--shadow-card)] dark:border-orange-950/40 dark:bg-orange-950/10 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Target className="size-5" aria-hidden="true" />
          </span>
          <span>
            <h3 className="text-base font-semibold">{copy.setupTitle}</h3>
            <p className="mt-1 text-sm text-muted">{hint}</p>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ProgressRing percent={percent} />
          <span className="max-w-28">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">{percent === 100 ? completedLabel : `${percent}%`}</p>
            <p className="text-[11px] leading-4 text-muted">{percent === 100 ? allDoneLabel : remainingLabel.replace("{count}", String(remaining))}</p>
          </span>
        </div>
      </div>
      <ol className="relative mt-6 grid grid-cols-8" aria-hidden="true">
        <span className={`absolute start-[6.25%] end-[6.25%] top-3 h-0.5 ${percent === 100 ? "bg-brand" : "bg-brand/25"}`} />
        {steps.map((step) => (
          <li key={step.id} className="relative flex justify-center">
            <span className={`inline-flex size-6 items-center justify-center rounded-full border-2 border-orange-50 dark:border-orange-950 ${step.done ? "bg-brand text-white" : "border-line bg-surface text-muted"}`}>
              {step.done ? <Check className="size-3.5" /> : null}
            </span>
          </li>
        ))}
      </ol>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {steps.map((step) => {
          const Icon = stepIcon[step.id];
          const href = settingsHref ? `${settingsHref}#${stepAnchor[step.id]}` : undefined;
          const body = (
            <>
              <span className={`inline-flex size-10 items-center justify-center rounded-2xl ${step.done ? stepTone[step.id] : "bg-surface-muted text-muted"}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="mt-3 text-center text-xs font-medium">{copy.steps[step.id]}</span>
              {step.done ? (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Check className="size-3" aria-hidden="true" />
                  {completedLabel}
                </span>
              ) : null}
            </>
          );
          return (
            <li key={step.id}>
              {href ? (
                <Link href={href} className="flex h-full flex-col items-center rounded-2xl border border-line bg-surface px-2 py-4 text-center shadow-sm hover:border-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                  {body}
                </Link>
              ) : (
                <div className="flex h-full flex-col items-center rounded-2xl border border-line bg-surface px-2 py-4 text-center shadow-sm">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <span className="relative inline-flex size-16 items-center justify-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 size-16 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" className="stroke-emerald-100 dark:stroke-emerald-950" strokeWidth="5" />
        <circle cx="32" cy="32" r={radius} fill="none" className="stroke-emerald-500" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-300">{percent}%</span>
    </span>
  );
}
