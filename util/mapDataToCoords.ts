import { interpolatePoint } from './interpolatePoint'
import { ceil, floor } from './math'

// h = H * w / W
// O(n)
export function mapDataToCoords (
  data: number[],
  max: number,
  { width, height: availableHeight }: { width: number, height: number },
  { startIndex, endIndex }: { startIndex: number, endIndex: number },
  lineWidth: number,
): { x: number, y: number }[] {
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
