import { BarChart3, FolderPlus, Paintbrush, Plus, QrCode } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";

type QuickActionsProps = {
  copy: DashboardCopy;
  base: string;
};

const tones = ["#10B981", "#F59E0B", "#3B82F6", "#8B5CF6", "#FF5A24"];

export function QuickActions({ copy, base }: QuickActionsProps) {
  const actions: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { href: `${base}/menu/products/new`, label: copy.addProduct, icon: Plus },
    { href: `${base}/menu/categories/new`, label: copy.addCategory, icon: FolderPlus },
    { href: `${base}/menu/appearance`, label: copy.customizeDesign, icon: Paintbrush },
    { href: `${base}/menu/qr`, label: copy.downloadQr, icon: QrCode },
    { href: `${base}/analytics`, label: copy.viewAnalytics, icon: BarChart3 },
  ];

  return (
    <section className="rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold">{copy.quickActions}</h2>
      <ul className="mt-3 space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const tone = tones[index] ?? "#FF5A24";
          return (
            <li key={action.href}>
              <Link
                href={action.href}
                className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5 text-sm font-medium transition hover:border-brand/30 hover:bg-surface-muted"
              >
                <span className="grid size-8 place-items-center rounded-xl" style={{ backgroundColor: `${tone}1A`, color: tone }}>
                  <Icon className="size-4" />
                </span>
                {action.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
