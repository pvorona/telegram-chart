const HIDDEN_LAYER_CLASS = 'graph__layer--hidden'

export function Graph ({
  width,
  height,
  strokeStyle,
  lineWidth,
}) {
  const element = document.createElement('canvas')
  element.style.width = `${width}px`
  element.style.height = `${height}px`
  element.width = width * devicePixelRatio
  element.height = height * devicePixelRatio
  element.className = 'graph__layer'

  const context = element.getContext('2d')
  context.strokeStyle = strokeStyle
  context.lineWidth = lineWidth * devicePixelRatio

  return { element, toggleVisibility, clear, renderPath }

  function toggleVisibility () {
    element.classList.toggle(HIDDEN_LAYER_CLASS)
  }

  function clear () {
    context.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio)
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