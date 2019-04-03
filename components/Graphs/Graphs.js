import { mapDataToCoords } from '../../util'

export function renderGraphs ({ context, graphNames, values, lineWidth, strokeStyles, startIndex, endIndex, max, width, height, ...visibilityState }) {
  context.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio)
  for (let i = 0; i < graphNames.length; i++) {
    const opacity = visibilityState[getVisibilityKey(graphNames[i])]
    if (opacity === 0) continue
    const color = `rgba(${hexToRGB(strokeStyles[graphNames[i]])},${opacity})`
    context.strokeStyle = color
    context.lineWidth = lineWidth * devicePixelRatio
    const points = mapDataToCoords(
      values[graphNames[i]],
      max,
      { width: width * devicePixelRatio, height: height * devicePixelRatio },
      { startIndex, endIndex },
      lineWidth * devicePixelRatio,
    )
    context.beginPath()
    for (let j = 0; j < points.length; j++) {
      const { x, y } = points[j]
      context.lineTo(x, y)
    }
    context.stroke()
  }
}

function hexToRGB (hex) {
  const [hash, r1, r2, g1, g2, b1, b2] = hex
  return [
    parseInt(r1 + r2, 16),
    parseInt(g1 + g2, 16),
    parseInt(b1 + b2, 16),
  ]
}

function getVisibilityKey (name) {
  return `${name}_opacity`
}