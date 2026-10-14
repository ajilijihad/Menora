export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const width = 96;
  const height = 36;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : index * step;
      const y = height - 4 - (value / max) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-24" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}
