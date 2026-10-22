export function percentileCont(values: readonly number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = 1 + fraction * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const lowerValue = sorted[lower - 1] ?? sorted[0] ?? 0;
  const upperValue = sorted[upper - 1] ?? lowerValue;
  if (lower === upper) return lowerValue;
  return lowerValue + (upperValue - lowerValue) * (rank - lower);
}
