import { formatClock, formatMoney } from "@/lib/i18n/format";
import type { PublicMenuCopy } from "@/lib/i18n/public-menu-copy";
import type { Locale } from "@/lib/i18n/locales";
import {
  hasOpenHours,
  localizedText,
  orderedDays,
  orderedSocials,
  phoneHref,
  secondaryText,
  type PublicMenu,
  type PublicProduct,
} from "@/lib/menus/public-menu";

export function productName(locale: Locale, product: Pick<PublicProduct, "name" | "nameAr">) {
  return localizedText(locale, product.name, product.nameAr);
}

export function productSecondary(locale: Locale, product: Pick<PublicProduct, "name" | "nameAr">) {
  return secondaryText(locale, product.name, product.nameAr);
}

export function productDescription(
  locale: Locale,
  product: Pick<PublicProduct, "description" | "descriptionAr">,
) {
  const english = product.description ?? "";
  if (!english && !product.descriptionAr) {
    return null;
  }

  return localizedText(locale, english, product.descriptionAr);
}

type HoursProps = {
  menu: PublicMenu;
  copy: PublicMenuCopy;
  locale: Locale;
  className?: string;
  itemClassName?: string;
};

export function HoursList({ menu, copy, locale, className, itemClassName }: HoursProps) {
  if (!hasOpenHours(menu.hours)) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-semibold tracking-wide">{copy.hours}</h2>
      <dl className={className}>
        {orderedDays().map((day) => {
          const hours = menu.hours[day];
          return (
            <div key={day} className={itemClassName}>
              <dt>{copy.days[day]}</dt>
              <dd>{hours.closed ? copy.closed : `${formatClock(hours.opens, locale)}–${formatClock(hours.closes, locale)}`}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

type ContactProps = {
  menu: PublicMenu;
  copy: PublicMenuCopy;
  className?: string;
  linkClassName?: string;
};

export function ContactLinks({ menu, copy, className, linkClassName }: ContactProps) {
  const phone = phoneHref(menu.phone);
  const socials = orderedSocials().filter((network) => menu.socialLinks[network]);
  if (!menu.phone && !menu.address && !menu.mapUrl && socials.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <h2 className="text-sm font-semibold tracking-wide">{copy.contact}</h2>
      {menu.address ? (
        <p>
          <span className="sr-only">{copy.address}: </span>
          {menu.address}
        </p>
      ) : null}
      {menu.phone && phone ? (
        <p>
          <a className={linkClassName} href={phone}>
            {copy.phone}: {menu.phone}
          </a>
        </p>
      ) : null}
      {menu.mapUrl ? (
        <p>
          <a className={linkClassName} href={menu.mapUrl} rel="noreferrer">
            {copy.map}
          </a>
        </p>
      ) : null}
      {socials.length > 0 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {socials.map((network) => (
            <li key={network}>
              <a className={linkClassName} href={menu.socialLinks[network]} rel="noreferrer">
                {copy.socials[network]}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

type OptionListProps = {
  label: string;
  options: PublicProduct["variants"];
  locale: Locale;
  currency: string;
  className?: string;
};

export function OptionList({ label, options, locale, currency, className }: OptionListProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide">{label}</p>
      <ul className={className}>
        {options.map((option) => (
          <li key={option.id}>
            <span dir="auto">{localizedText(locale, option.name, option.nameAr)}</span>
            <span className="ps-2 tabular-nums">{formatMoney(option.priceMinor, currency, locale) || option.priceLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LabelList({
  labels,
  copy,
  className,
}: {
  labels: PublicProduct["labels"];
  copy: PublicMenuCopy;
  className?: string;
}) {
  if (labels.length === 0) {
    return null;
  }

  return (
    <ul className={className}>
      {labels.map((label) => (
        <li key={label}>{copy.labels[label]}</li>
      ))}
    </ul>
  );
}

export function PricePair({
  product,
  copy,
  locale,
  currency,
  className,
  compareClassName,
}: {
  product: PublicProduct;
  copy: PublicMenuCopy;
  locale: Locale;
  currency: string;
  className?: string;
  compareClassName?: string;
}) {
  const compare = product.compareMinor === null ? "" : formatMoney(product.compareMinor, currency, locale);
  return (
    <p className={className}>
      {compare ? (
        <span className={compareClassName}>
          <span className="sr-only">{copy.was} </span>
          {compare}
        </span>
      ) : null}
      <span className="tabular-nums">{formatMoney(product.priceMinor, currency, locale) || product.priceLabel}</span>
    </p>
  );
}
