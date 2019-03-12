var renderPath = canvasRenderer

function canvasRenderer (points, color, targetContext) {
  targetContext.strokeStyle = color
  targetContext.lineWidth = 2 * IN.devicePixelRatio
  targetContext.beginPath();

  for (let i = 0; i < points.length; i++) {
    const { x, y, frameX, frameY } = points[i]
    targetContext.lineTo(x, y)
  }

  targetContext.stroke()
}
