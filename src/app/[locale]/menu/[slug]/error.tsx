"use client";

import { usePathname } from "next/navigation";

import { ErrorState } from "@/components/states/error-state";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeFromPathname } from "@/lib/i18n/locales";

export default function PublicMenuError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const locale = localeFromPathname(usePathname()) ?? "en";
  const copy = getDictionary(locale).publicMenu;

  return (
    <main data-public-menu className="flex flex-1 flex-col justify-center">
      <style>{`body > header { display: none !important; }`}</style>
      <ErrorState
        error={error}
        onRetry={retry}
        title={copy.errorTitle}
        description={copy.errorDescription}
        retryLabel={copy.retry}
      />
    </main>
  );
}
