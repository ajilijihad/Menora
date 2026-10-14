import Link from "next/link";

export function UpgradePrompt({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6">{description}</p>
      <Link href={href} className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline">
        {action}
      </Link>
    </div>
  );
}
