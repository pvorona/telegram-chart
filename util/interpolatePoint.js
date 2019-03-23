import { floor, ceil } from './math'

export function interpolatePoint (point, values) {
  return interpolate(
    floor(point), ceil(point),
    values[floor(point)], values[ceil(point)],
    point,
  )
}

function interpolate (x1, x2, y1, y2, x) {
  if (x === x2) return y2
  return (y2 - y1) / (x2 - x1) * (x - x1) + y1
}