export function ensureInBounds<T extends number>(value: T, min: T, max: T) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
