export function calculateLogScaleMultiplier (n) {
  return Math.log2(1 << 32 - Math.clz32(n)) - 3
}