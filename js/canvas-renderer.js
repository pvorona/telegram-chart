export var renderPath = canvasRenderer

function canvasRenderer (points, targetContext) {
  targetContext.beginPath();

  for (let i = 0; i < points.length; i++) {
    const { x, y } = points[i]
    targetContext.lineTo(x, y)
  }

  targetContext.stroke()
}
