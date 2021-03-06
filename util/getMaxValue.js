import { max, min, ceil } from './math'
import { interpolatePoint } from './interpolatePoint'
import { calculateOrderOfMagnitude } from './calculateOrderOfMagnitude'

function findMaxElement (values, { startIndex, endIndex }) {
  let maxValue = values[0][ceil(startIndex)]
  for (let j = 0; j < values.length; j++) {
    maxValue = max(maxValue, interpolatePoint(startIndex, values[j]), interpolatePoint(endIndex, values[j]))
    for (let i = ceil(startIndex); i <= endIndex; i++) {
      maxValue = max(values[j][i], maxValue)
    }
  }
  return maxValue
}

export function getMaxValue (viewBox, values) {
  return beautifyNumber(findMaxElement(values, viewBox))
}

function beautifyNumber (number) {
  const magnitude = calculateOrderOfMagnitude(number)
  if (number % magnitude === 0) return number
  if (number % (magnitude / 2) === 0) return number
  return number + ((magnitude / 2) - number % (magnitude / 2))
}

export function getMinValue ({ startIndex, endIndex }, values) {
  let minValue = values[0][ceil(startIndex)]
  for (let j = 0; j < values.length; j++) {
    minValue = min(minValue, interpolatePoint(startIndex, values[j]), interpolatePoint(endIndex, values[j]))
    for (let i = ceil(startIndex); i <= endIndex; i++) {
      minValue = min(values[j][i], minValue)
    }
  }
  return beautifyNumber(minValue)
}