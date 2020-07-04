import { interpolatePoint } from './interpolatePoint'
import { ceil, floor } from './math'

// h = H * w / W
// O(n)
export function mapDataToCoords (
  data: number[],
  max: number,
  min: number,
  { width, height: availableHeight }: { width: number, height: number },
  { startIndex, endIndex }: { startIndex: number, endIndex: number },
  lineWidth: number,
  offsetBottom: number | undefined = 0,
): { x: number, y: number }[] {
  const height = availableHeight - lineWidth * 2
  // const valueRange = max - min
  const coords = []

  if (!Number.isInteger(startIndex)) {
    const value = (height - offsetBottom) / (max - min) * (interpolatePoint(startIndex, data) - min)
    coords.push({
      x: 0,
      y: lineWidth + height - offsetBottom - value,
    })
  }

  for (let i = ceil(startIndex); i <= floor(endIndex); i++) {
    const value = (height - offsetBottom) / (max - min) * (data[i] - min)
    coords.push({
      x: width / (endIndex - startIndex) * (i - startIndex),
      y: lineWidth + height - offsetBottom - value,
    })
  }

  if (!Number.isInteger(endIndex)) {
    const value = (height - offsetBottom) / (max - min) * (interpolatePoint(endIndex, data) - min)
    coords.push({
      x: width,
      y: lineWidth + height - offsetBottom - value,
    })
  }
  return coords
}
