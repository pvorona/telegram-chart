const DOT_BORDER_SIZE = 2
const DOT_SIZE = 10
const CENTER_OFFSET = - DOT_SIZE / 2 - DOT_BORDER_SIZE

export function TooltipCircle ({ color }) {

  return { element, hide, show, setPosition }

  function show () {
    element.style.visibility = 'visible'
  }

  function hide () {
    element.style.visibility = ''
  }

  function setPosition ({ x, y }) {
    element.style.transform = `translateX(${x + CENTER_OFFSET}px) translateY(${y + CENTER_OFFSET}px)`
  }
}