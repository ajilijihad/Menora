"use client";

import { useRouter } from "next/navigation";

type BusinessOption = {
  id: string;
  name: string;
};

type BusinessSwitcherProps = {
  locale: string;
  label: string;
  currentId: string | null;
  businesses: BusinessOption[];
};

export function BusinessSwitcher({ locale, label, currentId, businesses }: BusinessSwitcherProps) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={currentId ?? ""}
        onChange={(event) => {
          const next = event.target.value;
          if (next) {
            router.push(`/${locale}/dashboard/businesses/${next}`);
          }
        }}
        className="h-10 max-w-48 rounded-full border border-line bg-surface px-3 text-sm text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {currentId ? null : <option value="">{label}</option>}
        {businesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.name}
          </option>
        ))}
      </select>
    </label>
  );
}
