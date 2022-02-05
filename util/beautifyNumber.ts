import { calculateOrderOfMagnitude } from "./calculateOrderOfMagnitude";

export function beautifyNumber(number: number): number {
  const magnitude = calculateOrderOfMagnitude(number);
  if (number % magnitude === 0) return number;
  if (number % (magnitude / 2) === 0) return number;
  return number + (magnitude / 2 - (number % (magnitude / 2)));
}
