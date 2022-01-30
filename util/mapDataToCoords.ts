import { Point } from "../components/types";
import { interpolatePoint } from "./interpolatePoint";
import { floor, ceil } from "./math";

const X_MUL = 100_000;
const Y_MUL = 1;

// h = H * w / W
// O(n)
export function mapDataToCoords(
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
    const value =
      ((height - offsetBottom) / (max - min)) *
      (interpolatePoint(startIndex, data) - min);
    const x = 0;
    const y = floor(lineWidth + height - offsetBottom - value);
    const key = x * X_MUL + y * Y_MUL;
    if (!used[key]) {
      used[key] = true;
      coords.push({ x, y });
    }
  }

  for (let i = ceil(startIndex); i <= floor(endIndex); i++) {
    const value = ((height - offsetBottom) / (max - min)) * (data[i] - min);
    const x = floor(
      (width / (getTime(domain, endIndex) - getTime(domain, startIndex))) *
        (getTime(domain, i) - getTime(domain, startIndex))
    );
    const y = floor(lineWidth + height - offsetBottom - value);

    const key = x * X_MUL + y * Y_MUL;
    if (!used[key]) {
      used[key] = true;
      coords.push({ x, y });
    }
  }

  if (!Number.isInteger(endIndex)) {
    const value =
      ((height - offsetBottom) / (max - min)) *
      (interpolatePoint(endIndex, data) - min);

    const x = floor(width);
    const y = floor(lineWidth + height - offsetBottom - value);

    const key = x * X_MUL + y * Y_MUL;
    if (!used[key]) {
      used[key] = true;
      coords.push({ x, y });
    }
  }

  return coords;
}

function getTime(domain: number[], index: number): number {
  if (Number.isInteger(index)) {
    return domain[index];
  }

  return (
    (domain[ceil(index)] - domain[floor(index)]) * (index % 1) +
    domain[floor(index)]
  );
}
