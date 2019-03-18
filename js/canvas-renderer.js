import { length } from './constants'

export var renderPath = canvasRenderer

function canvasRenderer (points, context) {
  context.beginPath();

  for (let i = 0; i < points[length]; i++) {
    const { x, y } = points[i]
    context.lineTo(x, y)
  }

  context.stroke()
}
