import {
  Bell,
  CreditCard,
  Mail,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CopySubjectButton, PreviewCanvas, RefreshPreviewButton, SendTestForm } from "@/components/admin/email-studio";
import { Notice } from "@/components/auth/notice";
import { LoadingState } from "@/components/states/loading-state";
import type { BillingCopy } from "@/lib/i18n/billing-copy";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import {
  isEmailTemplate,
  previewFacts,
  renderEmail,
  type EmailLocale,
  type EmailTemplateName,
} from "@/lib/email/messages";
import { sendPreviewEmailAction } from "@/modules/email/preview-action";
import { emailProviderStatus } from "@/modules/email/provider-status";
import { getOwnProfile } from "@/modules/auth";

type EmailPreviewPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const groups: Array<{ id: "account" | "payments" | "reminders"; icon: LucideIcon; templates: EmailTemplateName[] }> = [
  { id: "account", icon: Sparkles, templates: ["welcome"] },
  { id: "payments", icon: CreditCard, templates: ["payment_receipt", "renewal_confirmation", "payment_failed"] },
  { id: "reminders", icon: Bell, templates: ["reminder_7", "reminder_3", "reminder_1", "subscription_expired"] },
];

export async function generateMetadata({ params }: EmailPreviewPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  return { title: getDictionary(locale).billing.emailPreview, robots: { index: false, follow: false } };
}

export default async function EmailPreviewPage({ params, searchParams }: EmailPreviewPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  return (
    <Suspense fallback={<main className="flex flex-1 flex-col justify-center"><LoadingState label={dict.states.loading} /></main>}>
      <EmailPreviewContent locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function noticeMessage(copy: BillingCopy, notice: string | undefined): { tone: "success" | "error"; text: string } | null {
  if (notice !== "test_sent" && notice !== "test_failed") {
    return null;
  }
  return { tone: notice === "test_sent" ? "success" : "error", text: copy.messages[notice] };
}

function href(locale: Locale, template: EmailTemplateName, emailLocale: EmailLocale): string {
  return `/${locale}/admin/email?template=${template}&emailLocale=${emailLocale}`;
}

async function EmailPreviewContent({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: EmailPreviewPageProps["searchParams"];
}) {
  const query = await searchParams;
  const copy = getDictionary(locale).billing;
  const studio = copy.emailStudio;
  const templateValue = first(query.template);
  const template = templateValue && isEmailTemplate(templateValue) ? templateValue : "payment_receipt";
  const emailLocale: EmailLocale = first(query.emailLocale) === "ar" ? "ar" : "en";
  const preview = renderEmail(template, emailLocale, previewFacts);
  const notice = noticeMessage(copy, first(query.notice));
  const provider = emailProviderStatus();
  const profile = await getOwnProfile();
  const recipient = profile?.email?.trim() || null;
  const selected = studio.templates[template];
  const category = groups.find((group) => group.templates.includes(template))?.id ?? "payments";
  const languageName = emailLocale === "ar" ? studio.arabic : studio.english;
  const providerLabel = provider === "ready"
    ? studio.resendReady
    : provider === "missing_from"
      ? studio.resendMissingFrom
      : studio.resendMissing;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              <Mail className="size-3.5" aria-hidden="true" />
              {studio.transactional}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${provider === "ready" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-200"}`}>
              <span className={`size-1.5 rounded-full ${provider === "ready" ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
              {providerLabel}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{copy.emailPreview}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{copy.emailPreviewDescription}</p>
        </div>
      </header>

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[17rem_minmax(0,1fr)_16rem]">
        <nav aria-label={copy.emailPreview} className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:rounded-2xl xl:border xl:border-line xl:bg-surface xl:p-3 xl:shadow-[var(--shadow-card)]">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.id} className="flex min-w-max gap-2 xl:min-w-0 xl:flex-col">
                <p className="flex shrink-0 items-center gap-2 self-center px-1 text-xs font-semibold uppercase tracking-wide text-muted xl:w-full xl:self-start xl:px-2 xl:pt-2">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {studio.groups[group.id]}
                </p>
                {group.templates.map((item) => {
                  const active = item === template;
                  const meta = studio.templates[item];
                  return (
                    <Link
                      key={item}
                      href={href(locale, item, emailLocale)}
                      aria-current={active ? "page" : undefined}
                      className={`min-w-56 rounded-xl border px-3 py-2.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand xl:min-w-0 ${active ? "border-brand bg-brand/10" : "border-line bg-surface hover:bg-surface-muted"}`}
                    >
                      <span className="block text-sm font-semibold text-foreground">{meta.name}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted">{meta.description}</span>
                      <span className="mt-1 block text-[11px] font-medium text-muted">{studio.bothLanguages}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <section className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="flex flex-col gap-4 border-b border-line pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{studio.preview}</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted">{selected.description}</p>
              </div>
              <div className="inline-flex rounded-lg border border-line bg-surface-muted p-1" role="group" aria-label={studio.language}>
                {(["en", "ar"] as const).map((item) => (
                  <Link
                    key={item}
                    href={href(locale, template, item)}
                    hrefLang={item}
                    aria-current={emailLocale === item ? "true" : undefined}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${emailLocale === item ? "bg-surface text-foreground shadow-sm" : "text-muted"}`}
                  >
                    {item === "en" ? studio.english : studio.arabic}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RefreshPreviewButton label={studio.refreshPreview} />
              <CopySubjectButton subject={preview.subject} copy={studio} />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">{studio.subject}</span>
              <input readOnly value={preview.subject} className="h-10 w-full rounded-lg border border-line bg-surface-muted px-3 text-sm text-foreground" />
            </label>
          </div>

          <div className="mt-4">
            <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
              <span className="font-semibold">{studio.sample}. </span>
              {studio.sampleNote}
            </p>
            <PreviewCanvas html={preview.html} title={preview.subject} copy={studio} />
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <SendTestForm
              action={sendPreviewEmailAction}
              sendLabel={copy.sendTest}
              copy={studio}
              templateName={selected.name}
              languageName={languageName}
              recipient={recipient}
            >
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="template" value={template} />
              <input type="hidden" name="emailLocale" value={emailLocale} />
            </SendTestForm>
          </div>
        </section>

        <aside className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-foreground">{studio.details}</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <Detail label={studio.category} value={studio.groups[category]} />
            <Detail label={studio.identifier} value={template} mono />
            <Detail label={studio.language} value={languageName} />
            <Detail label={studio.subject} value={preview.subject} />
            <Detail label={studio.testSupport} value={studio.yes} />
          </dl>
          <p className="mt-4 text-xs leading-5 text-muted">{selected.description}</p>
        </aside>
      </div>
    </main>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 break-words text-foreground ${mono ? "font-mono text-xs" : "font-medium"}`}>{value}</dd>
    </div>
  );
}

