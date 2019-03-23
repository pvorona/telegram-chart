import { max, ceil } from './math'
import { interpolatePoint } from './interpolatePoint'

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
  const max = findMaxElement(values, viewBox)
  if (max % 50 === 0) return max
  // if (max % 5 === 0) return max
  return max + (50 - max % 50)
}
