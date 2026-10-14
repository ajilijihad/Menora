"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type DashboardFrameProps = {
  menuLabel: string;
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

export function DashboardFrame({ menuLabel, sidebar, topbar, children }: DashboardFrameProps) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  return (
    <div data-dashboard="" className="min-h-dvh bg-background text-foreground">
      {open ? (
        <button
          type="button"
          aria-label={menuLabel}
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setOpenPath(null)}
        />
      ) : null}
      <div className="lg:grid lg:min-h-dvh lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className={open ? "fixed inset-y-0 z-40 w-[260px] start-0 lg:static lg:block" : "hidden lg:sticky lg:top-0 lg:block lg:h-dvh"}>
          {sidebar}
        </div>
        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 overflow-visible border-b border-line bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
            <button
              type="button"
              aria-label={menuLabel}
              onClick={() => setOpenPath(pathname)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-foreground lg:hidden"
            >
              <Menu className="size-4" />
            </button>
            <div className="min-w-0 flex-1">{topbar}</div>
          </header>
          <div className="px-4 py-5 sm:px-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
