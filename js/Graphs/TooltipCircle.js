const DOT_BORDER_SIZE = 2
const DOT_SIZE = 10
const offset = - DOT_SIZE / 2 - DOT_BORDER_SIZE

export function TooltipCircle ({
  color,
  // x,
  // y,
  // visible,
}) {
  const element = document.createElement('div')
  element.style.width = `${DOT_SIZE}px`
  element.style.height = `${DOT_SIZE}px`
  element.style.borderColor = color
  element.className = 'tooltip__dot'

  return { element, hide, show, setPosition }

  function show () {
    element.style.visibility = 'visible'
  }

  function hide () {
    element.style.visibility = ''
  }

  function setPosition ({ x, y }) {
    element.style.transform = `translateX(${x + offset}px) translateY(${y + offset}px)`
  }
}