import { Point } from "../components/types";
import { interpolate, interpolatePoint } from "./interpolatePoint";
import { floor, ceil } from "./math";
import { measurePerformance } from "./measurePerformance";

// Hashing breaks if data range is high
const X_MUL = 100_000;

function hash(x: number, y: number) {
  return x * X_MUL + y;
}

function pushIfNew(
  x: number,
  y: number,
  used: { [key: number]: boolean },
  array: Point[]
) {
  const key = hash(x, y);

  if (!used[key]) {
    used[key] = false;
    array.push({ x, y });
  }
}

// h = H * w / W
// O(n)
export const mapDataToCoords = measurePerformance(function mapDataToCoords(
  data: number[],
  domain: number[],
  max: number,
  min: number,
  { width, height: availableHeight }: { width: number; height: number },
  { startIndex, endIndex }: { startIndex: number; endIndex: number },
  lineWidth: number,
  offsetBottom: number | undefined = 0
): Point[] {
  const height = availableHeight - lineWidth * 2;
  const coords: Point[] = [];
  const used: { [key: number]: boolean } = {};

  if (!Number.isInteger(startIndex)) {
    const x = 0;
    const y = toScreenY(
      data,
      min,
      max,
      lineWidth + height - offsetBottom,
      startIndex
    );

    pushIfNew(x, y, used, coords);
  }

  for (
    let currentIndex = ceil(startIndex);
    currentIndex <= floor(endIndex);
    currentIndex++
  ) {
    const x = toScreenX(domain, width, startIndex, endIndex, currentIndex);
    const y = toScreenY(
      data,
      min,
      max,
      lineWidth + height - offsetBottom,
      currentIndex
    );

    pushIfNew(x, y, used, coords);
  }

  if (!Number.isInteger(endIndex)) {
    const x = floor(width);
    const y = toScreenY(
      data,
      min,
      max,
      lineWidth + height - offsetBottom,
      endIndex
    );

    pushIfNew(x, y, used, coords);
  }

  return coords;
});

// Gets x by fractional index
function getX(domain: number[], index: number): number {
  if (Number.isInteger(index)) {
    return domain[index];
  }

  return (
    (domain[ceil(index)] - domain[floor(index)]) * (index % 1) +
    domain[floor(index)]
  );
}

export function toScreenX(
  xs: number[],
  width: number,
  startIndex: number,
  endIndex: number,
  currentIndex: number
) {
  // return floor(
    return interpolate(
      getX(xs, startIndex),
      getX(xs, endIndex),
      0,
      width,
      getX(xs, currentIndex)
    )
  // );
}

export function toScreenY(
  ys: number[],
  min: number,
  max: number,
  height: number,
  currentIndex: number
) {
  // return floor(
    return interpolate(max, min, 0, height, interpolatePoint(currentIndex, ys))
  // );

  const value =
    (height / (max - min)) * (interpolatePoint(currentIndex, ys) - min);
  return floor(height - value);
}
