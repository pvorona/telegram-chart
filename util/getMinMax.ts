import { max, min, ceil } from "./math";
import { interpolatePoint } from "./interpolatePoint";

export function getMinMax(
  startIndex: number,
  endIndex: number,
  values: number[]
): { min: number; max: number } {
  let minValue = min(
    interpolatePoint(startIndex, values),
    interpolatePoint(endIndex, values)
  );
  let maxValue = max(
    interpolatePoint(startIndex, values),
    interpolatePoint(endIndex, values)
  );

  for (let i = ceil(startIndex); i <= endIndex; i++) {
    minValue = min(values[i], minValue);
    maxValue = max(values[i], maxValue);
  }

  return { min: minValue, max: maxValue };
}
