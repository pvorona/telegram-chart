import { max, min, ceil, floor } from "./math";
import { interpolatePoint } from "./interpolatePoint";

export function getMinMax(
  startIndex: number,
  endIndex: number,
  values: number[]
): { min: number; max: number } {
  const firstValue = interpolatePoint(startIndex, values);
  const lastValue = interpolatePoint(endIndex, values);

  let minValue = min(firstValue, lastValue);
  let maxValue = max(firstValue, lastValue);

  for (let i = ceil(startIndex); i <= floor(endIndex); i++) {
    minValue = min(values[i], minValue);
    maxValue = max(values[i], maxValue);
  }

  return { min: minValue, max: maxValue };
}
