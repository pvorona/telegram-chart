import { mapDataToCoords } from '../../util'

const containerClassName = 'graphs'

export function Graphs ({
  graphNames,
  values,
  width,
  height,
  lineWidth,
  strokeStyles,
  startIndex,
  endIndex,
  max,
  ...visibilityState
}) {
  const { element, context } = createDOM()

  render({ startIndex, endIndex, max, width, height, ...visibilityState })

  return { element, render }

  function render ({ startIndex, endIndex, max, width, height, ...visibilityState }) {
    context.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio)
    for (let i = 0; i < graphNames.length; i++) {
      const color = `rgba(${hexToRGB(strokeStyles[graphNames[i]])},${visibilityState[getVisibilityKey(graphNames[i])]})`
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

  function createDOM () {
    const element = document.createElement('div')
    element.style.width = `${width}px`
    element.style.height = `${height}px`
    element.className = containerClassName
    const canvas = document.createElement('canvas')
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    const context = canvas.getContext('2d')
    element.appendChild(canvas)

    return { element, context }
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