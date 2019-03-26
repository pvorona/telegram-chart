import { mapDataToCoords } from '../../util'

const HIDDEN_LAYER_CLASS = 'graph--hidden'

export function Graph ({
  context,
  strokeStyle,
  lineWidth,
  data,
}) {
  return { render }

  function render ({ viewBox, max, opacity }) {
    setupContext()
    renderPath(
      mapDataToCoords(
        data,
        max,
        { width: context.canvas.width, height: context.canvas.height },
        viewBox,
        lineWidth,
      )
    )
  }

  function setupContext () {
    context.strokeStyle = strokeStyle
    context.lineWidth = lineWidth * devicePixelRatio
  }

  function renderPath (points) {
    context.beginPath();

    for (let i = 0; i < points.length; i++) {
      const { x, y } = points[i]
      context.lineTo(x, y)
    }

    context.stroke()
  }
}

// function setup ({ width, height, lineWidth, strokeStyle }) {
//   const element = document.createElement('canvas')
//   element.style.width = `${width}px`
//   element.style.height = `${height}px`
//   element.width = width * devicePixelRatio
//   element.height = height * devicePixelRatio
//   element.className = CLASS_NAME

//   const context = element.getContext('2d')
//   context.strokeStyle = strokeStyle
//   context.lineWidth = lineWidth * devicePixelRatio

//   return { element, context }
// }