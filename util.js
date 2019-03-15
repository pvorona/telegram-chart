function findMaxElement (values, { startIndex, endIndex }) {
  let max = values[0][Math.ceil(startIndex)]
  for (let j = 0; j < values.length; j++) {
    max = Math.max(max, interpolatePoint(startIndex, values[j]), interpolatePoint(endIndex, values[j]))
    for (let i = Math.ceil(startIndex); i <= endIndex; i++) {
      max = Math.max(values[j][i], max)
    }
  }
  return max
}

// O(n)
function getMaxValue (renderWindow, ...values) {
  const max = findMaxElement(values, renderWindow)
  if (Number.isNaN(max)) {
    debugger
  }
  if (max % 10 === 0) return max
  if (max % 5 === 0) return max
  return max + (5 - max % 5)
}

function clearCanvas (context, canvas) {
  context.clearRect(0, 0, canvas.width, canvas.height)
}

// h = H * w / W
// O(n)
function mapDataToCoords (data, max, targetContainer, { startIndex, endIndex }) {
  const coords = []

  if (!Number.isInteger(startIndex)) {
    coords.push({
      x: 0,
      y: targetContainer.height - targetContainer.height / max * interpolatePoint(startIndex, data),
    })
  }

  for (let i = Math.ceil(startIndex); i <= Math.floor(endIndex); i++) {
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

function animate (from, to, duration, callback) {
  const startAnimationTime = Date.now()
  let lastDispatchedValue = from
  let animating = true
  let animationId

  function frame () {
    const currentTime = Date.now()
    if (currentTime - startAnimationTime >= duration) {
      if (lastDispatchedValue !== to) {
        callback(to)
      }
      animating = false
    } else {
      const currentValue = interpolate(
        [startAnimationTime, startAnimationTime + duration],
        [from, to],
        currentTime,
      )
      callback(currentValue)
      lastDispatchedValue = currentValue
      animationId = requestAnimationFrame(frame)
    }
  }
  animationId = requestAnimationFrame(frame)

  return function cancelAnimation () {
    if (animating) {
      cancelAnimationFrame(animationId)
    }
  }
}