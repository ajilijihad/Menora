"use client";

import { useEffect } from "react";

import { StatusPanel, statusActionClassName } from "./status-panel";

type ErrorStateProps = {
  error: Error & { digest?: string };
  onRetry: () => void;
  title?: string;
  description?: string;
  retryLabel?: string;
};

export function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
  description = "This page could not be loaded. Try again.",
  retryLabel = "Try again",
}: ErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPanel title={title} description={description}>
      <button type="button" onClick={onRetry} className={statusActionClassName}>
        {retryLabel}
      </button>
      {error.digest ? (
        <p className="w-full text-sm text-zinc-500">Reference {error.digest}</p>
      ) : null}
    </StatusPanel>
  );
}
