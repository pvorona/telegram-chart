import { mapDataToCoords } from '../../util'

const HIDDEN_LAYER_CLASS = 'graph--hidden'

export function Graph ({
  context,
  strokeStyle,
  lineWidth,
  values,
  width,
  height,
}) {
  return { render }

  function render ({ startIndex, endIndex, max }) {
    setupContext()
    renderPath(
      mapDataToCoords(
        values,
        max,
        { width, height },
        { startIndex, endIndex },
        lineWidth,
      )
    )
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