export function calculateOrderOfMagnitude (n) {
  const order = Math.floor(Math.log(n) / Math.LN10 + 0.000000001)
  return Math.pow(10, order)
}