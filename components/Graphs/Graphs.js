export function renderGraphs ({ context, points, graphNames, lineWidth, strokeStyles, width, height, opacityState }) {
  context.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio)
  for (let i = 0; i < graphNames.length; i++) {
    const opacity = opacityState[graphNames[i]]
    if (opacity === 0) continue
    const color = `rgba(${hexToRGB(strokeStyles[graphNames[i]])},${opacity})`
    context.strokeStyle = color
    context.lineWidth = lineWidth * devicePixelRatio
    context.beginPath()
    for (let j = 0; j < points[graphNames[i]].length; j++) {
      const { x, y } = points[graphNames[i]][j]
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