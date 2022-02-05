import { Point } from "../components/types";
import { interpolate, interpolatePoint } from "./interpolatePoint";
import { ceil } from "./math";

export function mapDataToCoords(
  data: number[],
  domain: number[],
  max: number,
  min: number,
  { width, height: availableHeight }: { width: number; height: number },
  { startIndex, endIndex }: { startIndex: number; endIndex: number },
  lineWidth: number
): Point[] {
  const height = availableHeight - lineWidth * 2;
  const coords: Point[] = [];

  if (!Number.isInteger(startIndex)) {
    const x = 0;
    const y = toScreenY(data, min, max, height, startIndex);

    coords.push({ x, y });
  }

  for (
    let currentIndex = ceil(startIndex);
    currentIndex <= Math.floor(endIndex);
    currentIndex++
  ) {
    const x = toScreenX(domain, width, startIndex, endIndex, currentIndex);
    const y = toScreenY(data, min, max, height, currentIndex);

    coords.push({ x, y });
  }

  if (!Number.isInteger(endIndex)) {
    const x = width;
    const y = toScreenY(data, min, max, height, endIndex);

    coords.push({ x, y });
  }

  return coords;
}

// Gets x by fractional index
function getX(domain: number[], index: number): number {
  if (Number.isInteger(index)) {
    return domain[index];
  }

  return (
    (domain[ceil(index)] - domain[Math.floor(index)]) * (index % 1) +
    domain[Math.floor(index)]
  );
}

export function toScreenX(
  xs: number[],
  width: number,
  startIndex: number,
  endIndex: number,
  currentIndex: number
) {
  return interpolate(
    getX(xs, startIndex),
    getX(xs, endIndex),
    0,
    width,
    getX(xs, currentIndex)
  );
}

export function toScreenY(
  ys: number[],
  min: number,
  max: number,
  height: number,
  currentIndex: number
) {
  return interpolate(max, min, 0, height, interpolatePoint(currentIndex, ys));
}
