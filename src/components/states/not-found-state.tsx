import Link from "next/link";

import { StatusPanel, statusActionClassName } from "./status-panel";

type NotFoundStateProps = {
  title?: string;
  description?: string;
  homeHref?: string;
  actionLabel?: string;
};

export function NotFoundState({
  title = "Page not found",
  description = "This address does not match a page in Menor.",
  homeHref = "/",
  actionLabel = "Back to home",
}: NotFoundStateProps) {
  return (
    <StatusPanel title={title} description={description}>
      <Link href={homeHref} className={statusActionClassName}>
        {actionLabel}
      </Link>
    </StatusPanel>
  );
}
