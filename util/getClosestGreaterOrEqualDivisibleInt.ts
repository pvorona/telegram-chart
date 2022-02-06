export function getClosestGreaterOrEqualDivisibleInt(
  n: number,
  divisor: number
): number {
  const closestSmallerOrEqualDivisibleInt =
    getClosestSmallerOrEqualDivisibleInt(n, divisor);

  return closestSmallerOrEqualDivisibleInt >= n
    ? closestSmallerOrEqualDivisibleInt
    : getClosestGreaterDivisibleInt(n, divisor);
}

export function getClosestSmallerOrEqualDivisibleInt(
  n: number,
  divisor: number
): number {
  return n - (n % divisor);
}

export function getClosestGreaterDivisibleInt(n: number, divisor: number): number {
  return n + divisor - (n % divisor);
}
