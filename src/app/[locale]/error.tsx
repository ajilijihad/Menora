"use client";

import { usePathname } from "next/navigation";

import { ErrorState } from "@/components/states/error-state";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeFromPathname } from "@/lib/i18n/locales";

export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const locale = localeFromPathname(usePathname()) ?? "en";
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col justify-center">
      <ErrorState
        error={error}
        onRetry={retry}
        title={dict.states.errorTitle}
        description={dict.states.errorDescription}
        retryLabel={dict.states.retry}
      />
    </main>
  );
}
