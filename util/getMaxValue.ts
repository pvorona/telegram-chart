import { max, min, ceil } from './math'
import { interpolatePoint } from './interpolatePoint'
import { calculateOrderOfMagnitude } from './calculateOrderOfMagnitude'

export function getMaxValue ({ startIndex, endIndex }: { startIndex: number, endIndex: number}, values: number[][]): number {
  let maxValue = values[0][ceil(startIndex)]
  for (let j = 0; j < values.length; j++) {
    maxValue = max(maxValue, interpolatePoint(startIndex, values[j]), interpolatePoint(endIndex, values[j]))
    for (let i = ceil(startIndex); i <= endIndex; i++) {
      maxValue = max(values[j][i], maxValue)
    }
  }
  return maxValue
}

export function recoveredSeries (series: number[], startIndex: number, endIndex: number) {
  const result = []
  if (!Number.isInteger(startIndex)) {
    result.push(interpolatePoint(startIndex, series))
  }
  result.push(...series.filter((_, index) => index >= startIndex && index <= endIndex))
  if (!Number.isInteger(endIndex)) {
    result.push(interpolatePoint(endIndex, series))
  }
  return result
}

// export function getValuesInRange ({ startIndex, endIndex }: { startIndex: number, endIndex: number}, values: number[][]): number {
//   const
//   for (let j = 0; j < values.length; j++) {
//     maxValue = max(maxValue, interpolatePoint(startIndex, values[j]), interpolatePoint(endIndex, values[j]))
//     for (let i = ceil(startIndex); i <= endIndex; i++) {
//       maxValue = max(values[j][i], maxValue)
//     }
//   }
//   return maxValue
// }

export function beautifyNumber (number: number): number {
  const magnitude = calculateOrderOfMagnitude(number)
  if (number % magnitude === 0) return number
  if (number % (magnitude / 2) === 0) return number
  return number + ((magnitude / 2) - number % (magnitude / 2))
}

export function getMinValue ({ startIndex, endIndex }: { startIndex: number, endIndex: number}, values: number[][]) {
  let minValue = values[0][ceil(startIndex)]
  for (let j = 0; j < values.length; j++) {
    minValue = min(minValue, interpolatePoint(startIndex, values[j]), interpolatePoint(endIndex, values[j]))
    for (let i = ceil(startIndex); i <= endIndex; i++) {
      minValue = min(values[j][i], minValue)
    }
  }
  return beautifyNumber(minValue)
}