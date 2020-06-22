import { floor, ceil } from './math'

export function interpolatePoint (point: number, values: number[]): number {
  return interpolate(
    floor(point), ceil(point),
    values[floor(point)], values[ceil(point)],
    point,
  )
}

function interpolate (x1: number, x2: number, y1: number, y2: number, x: number) {
  if (x === x2) return y2
  return (y2 - y1) / (x2 - x1) * (x - x1) + y1
}