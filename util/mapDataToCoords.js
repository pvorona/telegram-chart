import { interpolatePoint } from './interpolatePoint'
import { ceil, floor } from './math'

// h = H * w / W
// O(n)
export function mapDataToCoords (data, max, { width, height }, { startIndex, endIndex }) {
  const coords = []

  if (!Number.isInteger(startIndex)) {
    coords.push({
      x: 0,
      y: height - height / max * interpolatePoint(startIndex, data),
    })
  }

  // In case there is more data than awailable pixels
  // we will aggregate data so that there is only
  // one point per pixel
  const step = (endIndex - startIndex) / width > 1.5 ? (endIndex - startIndex) / width : 1
  for (let i = ceil(startIndex); i <= floor(endIndex); i += step) {
    coords.push({
      x: width / (endIndex - startIndex) * (i - startIndex),
      y: height - height / max * interpolatePoint(i, data),
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
