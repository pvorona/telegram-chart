export function areNumbersClose(a: number, b: number, epsilon = 1e-3) {
  return Math.abs(a - b) <= epsilon;
}
