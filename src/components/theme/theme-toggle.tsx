"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect } from "react";

type ThemeName = "light" | "dark";

const storageKey = "menor-theme";

function readStoredTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function currentTheme(): ThemeName {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") {
    return explicit;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function persistTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Private browsing can reject storage. The choice still applies to this page.
  }
}

export function ThemeSync() {
  useLayoutEffect(() => {
    const explicit = document.documentElement.dataset.theme;
    if (explicit === "light" || explicit === "dark") {
      return;
    }

    const stored = readStoredTheme();
    if (stored) {
      persistTheme(stored);
    }
  }, []);

  return null;
}

type ThemeToggleProps = {
  label: string;
};

export function ThemeToggle({ label }: ThemeToggleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        persistTheme(currentTheme() === "dark" ? "light" : "dark");
      }}
      className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-foreground shadow-[var(--shadow-card)] transition hover:border-brand/40"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </button>
  );
}
