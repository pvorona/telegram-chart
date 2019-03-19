const LINE_WIDTH = 1

export function TooltipLine () {
  const element = document.createElement('div')
  element.className = 'tooltip-line'

  return { element, show, hide, setPosition }

  function show () {
    element.style.visibility = 'visible'
  }

  function hide () {
    element.style.visibility = ''
  }

  function setPosition (x) {
    element.style.transform = `translateX(${x - LINE_WIDTH / 2}px)`
  }
}