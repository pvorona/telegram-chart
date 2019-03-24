export function calculateLogScaleMultiplier (n) {
  for (let i = 3; i < 50; i++) {
    if (n < Math.pow(2, i)) return i - 3
  }
}