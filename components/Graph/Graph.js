import { mapDataToCoords } from '../../util'

const HIDDEN_LAYER_CLASS = 'graph--hidden'

export function Graph ({
  context,
  strokeStyle,
  lineWidth,
  data,
}) {
  return { render, toggleVisibility }

  function render ({ startIndex, endIndex, max, opacity }) {
    setupContext()
    renderPath(
      mapDataToCoords(
        data,
        max,
        { width: context.canvas.width, height: context.canvas.height },
        { startIndex, endIndex },
        lineWidth,
      )
    )
  }

  function toggleVisibility () {

  }

  function setupContext () {
    context.strokeStyle = strokeStyle
    context.lineWidth = lineWidth * devicePixelRatio
  }

  function renderPath (points) {
    context.beginPath()
    for (let i = 0; i < points.length; i++) {
      const { x, y } = points[i]
      context.lineTo(x, y)
    }
    context.stroke()
  }
}