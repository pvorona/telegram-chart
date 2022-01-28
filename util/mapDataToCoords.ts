import { interpolatePoint } from "./interpolatePoint";
import { ceil, floor } from "./math";

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
): { x: number; y: number }[] {
  const height = availableHeight - lineWidth * 2;
  const coords = [];

  if (!Number.isInteger(startIndex)) {
    const value =
      ((height - offsetBottom) / (max - min)) *
      (interpolatePoint(startIndex, data) - min);
    coords.push({
      x: 0,
      y: Math.floor(lineWidth + height - offsetBottom - value),
    });
  }

  for (let i = ceil(startIndex); i <= floor(endIndex); i++) {
    const value = ((height - offsetBottom) / (max - min)) * (data[i] - min);
    coords.push({
      x: Math.floor(
        (width / (getTime(domain, endIndex) - getTime(domain, startIndex))) *
          (getTime(domain, i) - getTime(domain, startIndex))
      ),
      y: Math.floor(lineWidth + height - offsetBottom - value),
    });
  }

  if (!Number.isInteger(endIndex)) {
    const value =
      ((height - offsetBottom) / (max - min)) *
      (interpolatePoint(endIndex, data) - min);
    coords.push({
      x: Math.floor(width),
      y: Math.floor(lineWidth + height - offsetBottom - value),
    });
  }
  return coords;
}

function getTime(domain: number[], index: number): number {
  if (Number.isInteger(index)) {
    return domain[index];
  }

  return (
    (domain[Math.ceil(index)] - domain[Math.floor(index)]) * (index % 1) +
    domain[Math.floor(index)]
  );
}
