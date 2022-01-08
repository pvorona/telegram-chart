export function calculateLogScaleMultiplier(n: number): number {
  return Math.log2(1 << (32 - Math.clz32(n))) - 5;
}
