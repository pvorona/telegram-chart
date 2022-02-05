import { floor, ceil } from "./math";

export function interpolatePoint(point: number, values: number[]): number {
  return interpolate(
    floor(point),
    ceil(point),
    values[floor(point)],
    values[ceil(point)],
    point
  );
}

export function interpolate<T extends number>(
  x1: number,
  x2: number,
  y1: T,
  y2: T,
  x: number
): T {
  if (x === x2) return y2;
  return (((y2 - y1) / (x2 - x1)) * (x - x1) + y1) as T;
}
