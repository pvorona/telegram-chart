function findMaxElement (values, { startIndex, floatStartIndex, endIndex}) {
  let max = values[0][startIndex]
  for (let j = 0; j < values.length; j++) {
    for (let i = startIndex; i <= endIndex; i++) {
      if (values[j][i] > max) max = values[j][i]
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
  const H = (data[rightIndex] - data[leftIndex])
  const w = floatStartIndex - leftIndex
  const inCurrent = H * w + data[leftIndex]
  coords.push({
    x: 0,
    y: targetContainer.height - targetContainer.height / max * inCurrent,
  })
  for (let i = startIndex; i <= endIndex; i++) {
    coords.push({
      x: targetContainer.width / (floatEndIndex - floatStartIndex) * (i - floatStartIndex),
      y: targetContainer.height - targetContainer.height / max * data[i],
    })
  }
  coords.push({
    x: targetContainer.width,
    y: targetContainer.height - targetContainer.height / max * ( (data[Math.ceil(floatEndIndex)] - data[Math.floor(floatEndIndex)]) * (floatEndIndex % 1) + data[Math.floor(floatEndIndex)] ),
  })
  return coords
}
