import { Crown } from "lucide-react";
import Link from "next/link";

import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";

type PlanCardProps = {
  copy: DashboardCopy;
  name: string | null;
  days: number | null;
  href: string | null;
};

export function PlanCard({ copy, name, days, href }: PlanCardProps) {
  return (
    <section className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-4 shadow-[var(--shadow-card)] dark:border-amber-400/20 dark:from-amber-400/10 dark:to-surface">
      <div className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-amber-400/20 text-amber-500">
          <Crown className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">{name ?? copy.planUnavailable}</p>
          {days !== null ? (
            <p className="mt-1 text-xs text-muted">
              {days} {copy.daysLeft}
            </p>
          ) : null}
        </div>
      </div>
      {href ? (
        <Link href={href} className="mt-4 inline-flex text-sm font-medium text-brand hover:text-brand-hover">
          {copy.upgrade}
        </Link>
      ) : null}
    </section>
  );
}
