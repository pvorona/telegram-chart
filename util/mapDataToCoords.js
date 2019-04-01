import { interpolatePoint } from './interpolatePoint'
import { ceil, floor } from './math'

// h = H * w / W
// O(n)
export function mapDataToCoords (data, max, { width, height: availableHeight }, { startIndex, endIndex }, lineWidth) {
  const height = availableHeight - lineWidth * 2
  const coords = []

  if (!Number.isInteger(startIndex)) {
    coords.push({
      x: 0,
      y: height - height / max * interpolatePoint(startIndex, data),
    })
  }

  for (let i = ceil(startIndex); i <= floor(endIndex); i++) {
    coords.push({
      x: width / (endIndex - startIndex) * (i - startIndex),
      y: lineWidth + height - height / max * interpolatePoint(i, data),
    })
  }

  if (!Number.isInteger(endIndex)) {
    coords.push({
      x: width,
      y: height - height / max * interpolatePoint(endIndex, data),
    })
  }
  return coords
}
