"use client";

import { SettingsEditor } from "@/components/business/settings-editor";
import type { BusinessFormValues, BusinessMessageCode } from "@/lib/businesses/schema";
import type { BusinessCopy } from "@/lib/i18n/business-copy";
import type { Locale } from "@/lib/i18n/locales";

type BusinessFormProps = {
  locale: Locale;
  copy: BusinessCopy;
  mode: "create" | "edit";
  businessId?: string;
  initial: BusinessFormValues;
  logoUrl: string | null;
  coverUrl: string | null;
  menuOrigin?: string | null;
  canDelete?: boolean;
  deleteHref?: string;
  notice?: BusinessMessageCode | null;
};

export function BusinessForm({
  locale,
  copy,
  mode,
  businessId,
  initial,
  logoUrl,
  coverUrl,
  menuOrigin = null,
  canDelete = false,
  deleteHref = "",
  notice = null,
}: BusinessFormProps) {
  return (
    <SettingsEditor
      locale={locale}
      copy={copy}
      mode={mode}
      businessId={businessId}
      initial={initial}
      logoUrl={logoUrl}
      coverUrl={coverUrl}
      menuOrigin={menuOrigin}
      canDelete={canDelete}
      deleteHref={deleteHref}
      notice={notice}
    />
  );
}
