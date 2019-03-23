import { interpolatePoint } from './interpolatePoint'
import { ceil, floor } from './math'

// h = H * w / W
// O(n)
export function mapDataToCoords (data, max, targetContainer, { startIndex, endIndex }) {
  const coords = []

  if (!Number.isInteger(startIndex)) {
    coords.push({
      x: 0,
      y: targetContainer.height - targetContainer.height / max * interpolatePoint(startIndex, data),
    })
  }

  for (let i = ceil(startIndex); i <= floor(endIndex); i++) {
    coords.push({
      x: targetContainer.width / (endIndex - startIndex) * (i - startIndex),
      y: targetContainer.height - targetContainer.height / max * data[i],
    })
  }

  if (!Number.isInteger(endIndex)) {
    coords.push({
      x: targetContainer.width,
      y: targetContainer.height - targetContainer.height / max * interpolatePoint(endIndex, data),
    })
  }

  return coords
}
