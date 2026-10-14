"use client";

import { useState } from "react";
import Link from "next/link";

import { signOutAction } from "@/modules/auth/actions";

type AccountMenuProps = {
  label: string;
  name: string;
  role: string;
  initial: string;
  logoUrl: string | null;
  profileHref: string;
  profileLabel: string;
  adminHref: string | null;
  adminLabel: string;
  logoutLabel: string;
  locale: string;
};

export function AccountMenu({
  label,
  name,
  role,
  initial,
  logoUrl,
  profileHref,
  profileLabel,
  adminHref,
  adminLabel,
  logoutLabel,
  locale,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="flex max-w-56 items-center gap-2 rounded-2xl border border-line bg-surface px-2 py-1.5 text-start shadow-[var(--shadow-card)]"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{initial}</span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{name}</span>
          <span className="block truncate text-xs text-muted">{role}</span>
        </span>
      </button>
      {open ? (
        <div className="absolute end-0 z-50 mt-2 w-48 rounded-2xl border border-line bg-surface p-1 shadow-[var(--shadow-card)]">
          <Link href={profileHref} className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-muted" onClick={() => setOpen(false)}>
            {profileLabel}
          </Link>
          {adminHref ? (
            <Link href={adminHref} className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-muted" onClick={() => setOpen(false)}>
              {adminLabel}
            </Link>
          ) : null}
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="block w-full rounded-xl px-3 py-2 text-start text-sm hover:bg-surface-muted">
              {logoutLabel}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
