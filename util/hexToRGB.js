const cache = {}

export function hexToRGB (hex) {
  if (cache[hex]) {
    return cache[hex]
  }

  const [hash, r1, r2, g1, g2, b1, b2] = hex
  const rgb = [
    parseInt(r1 + r2, 16),
    parseInt(g1 + g2, 16),
    parseInt(b1 + b2, 16),
  ].join(',')
  cache[hex] = rgb
  return rgb
}