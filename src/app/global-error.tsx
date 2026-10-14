"use client";

import { ErrorState } from "@/components/states/error-state";
import { getDictionary } from "@/lib/i18n/dictionaries";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const en = getDictionary("en");
  const ar = getDictionary("ar");

  return (
    <html lang="en">
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        <main className="flex flex-1 flex-col justify-center">
          <ErrorState
            error={error}
            onRetry={retry}
            title={`${en.states.errorTitle} / ${ar.states.errorTitle}`}
            description={`${en.states.errorDescription} ${ar.states.errorDescription}`}
            retryLabel={`${en.states.retry} / ${ar.states.retry}`}
          />
        </main>
      </body>
    </html>
  );
}
