function findMaxElement (values, { startIndex, floatStartIndex, endIndex, floatEndIndex }) {
  let max = values[0][startIndex]
  for (let j = 0; j < values.length; j++) {
    max = Math.max(max, interpolatePoint(floatStartIndex, values[j]), interpolatePoint(floatEndIndex, values[j]))
    for (let i = startIndex; i <= endIndex; i++) {
      max = Math.max(values[j][i], max)
    }
  }
  return max
}

// O(n)
function getMaxValue (renderWindow, ...values) {
  const max = findMaxElement(values, renderWindow)
  if (max % 10 === 0) return max
  if (max % 5 === 0) return max
  return max + (5 - max % 5)
}

function clearCanvas (context, canvas) {
  context.clearRect(0, 0, canvas.width, canvas.height)
}

// h = H * w / W
// O(n)
function mapDataToCoords (data, max, targetContainer, { startIndex, floatStartIndex, floatEndIndex, endIndex }) {
  const coords = []
  const leftIndex = Math.floor(floatStartIndex)
  const rightIndex = Math.ceil(floatStartIndex)
  coords.push({
    x: 0,
    y: targetContainer.height - targetContainer.height / max * interpolatePoint(floatStartIndex, data),
  })
  for (let i = startIndex; i <= endIndex; i++) {
    coords.push({
      x: targetContainer.width / (floatEndIndex - floatStartIndex) * (i - floatStartIndex),
      y: targetContainer.height - targetContainer.height / max * data[i],
    })
  }
  const endLeftIndex = Math.floor(floatEndIndex)
  const endRightIndex = Math.ceil(floatEndIndex)

  coords.push({
    x: targetContainer.width,
    y: targetContainer.height - targetContainer.height / max * interpolatePoint(floatEndIndex, data),
  })
  return coords
}

function interpolatePoint (point, values) {
  return interpolate(
    [Math.floor(point), Math.ceil(point)],
    [values[Math.floor(point)], values[Math.ceil(point)]],
    point,
  )
}

function interpolate ([x1, x2], [y1, y2], x) {
  if (x === x1) return y1
  if (x === x2) return y2
  return (y2 - y1) / (x2 - x1) * (x - x1) + y1
}