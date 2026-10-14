type Slice = {
  label: string;
  value: number;
  color: string;
  percent: string;
};

export function DonutChart({
  slices,
  total,
  totalLabel,
  label,
}: {
  slices: Slice[];
  total: number;
  totalLabel?: string;
  label: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const drawn = slices.filter((slice) => slice.value > 0);
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="size-36 shrink-0" role="img" aria-label={label}>
        <circle cx="60" cy="60" r={radius} fill="none" className="stroke-surface-muted" strokeWidth="14" />
        {drawn.length === 1 ? (
          <circle cx="60" cy="60" r={radius} fill="none" stroke={drawn[0]?.color} strokeWidth="14" />
        ) : (
          drawn.map((slice) => {
            const length = (slice.value / total) * circumference;
            const dash = `${length} ${circumference - length}`;
            const element = (
              <circle
                key={slice.label}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
              />
            );
            offset += length;
            return element;
          })
        )}
        <text x="60" y="64" textAnchor="middle" className="fill-foreground text-[18px] font-semibold">
          {totalLabel ?? total}
        </text>
      </svg>
      <ul className="flex w-full flex-col gap-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="truncate text-muted">{slice.label}</span>
            <span className="tabular-nums font-medium">{slice.value}</span>
            <span className="w-10 text-end text-xs tabular-nums text-muted">{slice.percent}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
