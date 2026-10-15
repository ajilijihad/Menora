"use client";

import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";

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
  const options = [
    ...(currentId ? [] : [{ value: "", label, disabled: true }]),
    ...businesses.map((business) => ({ value: business.id, label: business.name })),
  ];

  return (
    <Select
      ariaLabel={label}
      value={currentId ?? ""}
      placeholder={label}
      onValueChange={(next) => {
        if (next) {
          router.push(`/${locale}/dashboard/businesses/${next}`);
        }
      }}
      options={options}
      className="h-10 max-w-48 rounded-full border border-line bg-surface px-3 text-sm text-foreground"
    />
  );
}
