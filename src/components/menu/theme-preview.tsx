import type { MenuTheme } from "@/lib/menus/appearance";

export function ThemePreview({ theme }: { theme: MenuTheme }) {
  if (theme === "clean-light") {
    return (
      <div className="flex h-28 flex-col gap-2 rounded-xl bg-[#fffaf6] p-2">
        <div className="h-8 rounded-lg bg-[#ffe8d2]" />
        <div className="h-4 w-10 rounded-full bg-[#ff7a1a]" />
        <div className="grid flex-1 grid-cols-2 gap-1">
          <div className="rounded-md bg-white shadow-sm" />
          <div className="rounded-md bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (theme === "premium-gold") {
    return (
      <div className="flex h-28 flex-col gap-2 rounded-xl bg-[#070707] p-2">
        <div className="h-8 rounded-md border border-[#d4af37]/50 bg-[#1a1408]" />
        <div className="h-3 w-12 rounded-full bg-[#d4af37]" />
        <div className="h-px bg-[#d4af37]/70" />
        <div className="grid flex-1 grid-cols-3 gap-1">
          <div className="rounded-sm border border-[#d4af37]/40" />
          <div className="rounded-sm border border-[#d4af37]/40" />
          <div className="rounded-sm border border-[#d4af37]/40" />
        </div>
      </div>
    );
  }

  if (theme === "fresh-green") {
    return (
      <div className="flex h-28 flex-col gap-2 rounded-xl bg-[#f6f3ea] p-2">
        <div className="h-8 rounded-lg bg-[#e7f0e4]" />
        <div className="h-4 w-10 rounded-full bg-[#3f6b4a]" />
        <div className="grid flex-1 grid-cols-2 gap-1">
          <div className="rounded-md bg-white" />
          <div className="rounded-md bg-white" />
        </div>
      </div>
    );
  }

  if (theme === "traditional-beige") {
    return (
      <div className="h-28 rounded-xl bg-[#e6d0ae] p-1.5">
        <div className="flex h-full flex-col gap-1 border-4 border-[#6b3e26] bg-[#f4e7d2] p-1.5">
          <div className="h-6 rounded-sm bg-[#d7b48a]" />
          <div className="h-2 w-8 rounded-full bg-[#3b2415]" />
          <div className="h-px bg-[#6b3e26]/40" />
          <div className="h-2 rounded-sm bg-[#ead7b8]" />
          <div className="h-2 rounded-sm bg-[#ead7b8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-28 flex-col gap-2 rounded-xl bg-[#0c0c0e] p-2">
      <div className="h-8 rounded-lg bg-gradient-to-t from-black to-[#3a2418]" />
      <div className="h-4 w-10 rounded-md bg-[#ff7a1a]" />
      <div className="grid flex-1 gap-1">
        <div className="rounded-md border border-white/15" />
        <div className="rounded-md border border-white/15" />
      </div>
    </div>
  );
}
