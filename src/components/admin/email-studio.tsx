"use client";

import { Check, Copy, Maximize2, RefreshCw, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import type { BillingCopy } from "@/lib/i18n/billing-copy";

export function RefreshPreviewButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
    >
      <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />
      {label}
    </button>
  );
}

export function CopySubjectButton({
  subject,
  copy,
}: {
  subject: string;
  copy: BillingCopy["emailStudio"];
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(subject);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2000);
  }

  const label = state === "copied" ? copy.copied : state === "failed" ? copy.copyFailed : copy.copySubject;

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {state === "copied" ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      {label}
    </button>
  );
}

export function PreviewCanvas({
  html,
  title,
  copy,
}: {
  html: string;
  title: string;
  copy: BillingCopy["emailStudio"];
}) {
  const [expanded, setExpanded] = useState(false);
  const frame = (
    <iframe
      title={title}
      sandbox=""
      srcDoc={html}
      className={expanded ? "h-[min(860px,calc(100dvh-8rem))] w-full bg-white" : "h-[36rem] w-full max-w-full bg-white"}
    />
  );

  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background/80 p-4 backdrop-blur-sm sm:p-8">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-end pb-3">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
            {copy.collapse}
          </button>
        </div>
        <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-[#f5f7fb] shadow-[var(--shadow-card)]">{frame}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-[#f5f7fb] p-3 sm:p-6">{frame}</div>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Maximize2 className="size-4" aria-hidden="true" />
        {copy.expand}
      </button>
    </div>
  );
}

export function SendTestForm({
  action,
  sendLabel,
  copy,
  templateName,
  languageName,
  recipient,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  sendLabel: string;
  copy: BillingCopy["emailStudio"];
  templateName: string;
  languageName: string;
  recipient: string | null;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!recipient) {
    return <p className="text-sm text-muted">{copy.recipientMissing}</p>;
  }

  const body = copy.confirmBody
    .replace("{template}", templateName)
    .replace("{language}", languageName)
    .replace("{email}", recipient);

  return (
    <form action={action} className="flex flex-col items-start gap-3">
      {children}
      <p className="text-sm leading-6 text-muted">{copy.recipient.replace("{email}", recipient)}</p>
      <button
        type="button"
        onClick={() => {
          if (!dialogRef.current?.open) {
            dialogRef.current?.showModal();
          }
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Send className="size-4" aria-hidden="true" />
        {sendLabel}
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-5 text-foreground shadow-[var(--shadow-card)] backdrop:bg-black/40"
      >
        <h2 className="text-base font-semibold">{copy.confirmTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted"
          >
            {copy.cancel}
          </button>
          <ConfirmSubmit label={copy.confirmSend} sending={copy.sending} />
        </div>
      </dialog>
    </form>
  );
}

function ConfirmSubmit({ label, sending }: { label: string; sending: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      <Send className="size-4" aria-hidden="true" />
      {pending ? sending : label}
    </button>
  );
}
