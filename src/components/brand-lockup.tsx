export function BrandLockup({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const mark = name.trim().slice(0, 1).toUpperCase() || "M";

  return (
    <span className="inline-flex items-center gap-2 font-semibold">
      {logoUrl ? (
        // CMS logos are stored in the public media bucket and already sized for this mark.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-8 rounded-lg object-contain" />
      ) : (
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">{mark}</span>
      )}
      <span>{name}</span>
    </span>
  );
}
