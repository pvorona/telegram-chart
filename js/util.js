const { max, ceil, floor, pow } = Math
export { max, ceil, floor, pow }

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

export function getMaxValue (renderWindow, values) {
  const max = findMaxElement(values, renderWindow)
  if (max % 10 === 0) return max
  if (max % 5 === 0) return max
  return max + (5 - max % 5)
}

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

function interpolatePoint (point, values) {
  return interpolate(
    floor(point), ceil(point),
    values[floor(point)], values[ceil(point)],
    point,
  )
}

function interpolate (x1, x2, y1, y2, x) {
  if (x === x2) return y2
  return (y2 - y1) / (x2 - x1) * (x - x1) + y1
}

function easing (t) {
  return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function animate (from, to, duration, callback) {
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
      const currentValue = easing(
        (currentTime - startAnimationTime) / duration
      ) * (to - from) + from
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