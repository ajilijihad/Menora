type SparklineProps = {
  values: number[];
  color: string;
};

export function Sparkline({ values, color }: SparklineProps) {
  if (values.length < 2 || values.every((value) => value === 0)) {
    return null;
  }

  const max = Math.max(...values, 1);
  const step = 72 / (values.length - 1);
  const points = values
    .map((value, index) => `${index * step},${28 - (value / max) * 24}`)
    .join(" ");

  return (
    <svg viewBox="0 0 72 32" className="mt-3 h-8 w-16" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}
