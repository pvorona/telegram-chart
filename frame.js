const frameConfig = {
  resizerWidthPixels: 8,
  canvas: document.querySelector('#frame'),
  resizer: {
    left: document.querySelector('.frame__resizer-left'),
    right: document.querySelector('.frame__resizer-right'),
  },
  background: {
    left: document.querySelector('.frame__background-left'),
    right: document.querySelector('.frame__background-right'),
  }
}

const frameState = {
  left: 0,
  right: 0,
  cursorResizerDelta: 0,
}


function initFrame () {
  frameConfig.resizer.left.addEventListener('mousedown', onLeftResizerMouseDown)
  frameConfig.resizer.right.addEventListener('mousedown', onRightResizerMouseDown)
}

function onLeftResizerMouseDown (e) {
  frameState.cursorResizerDelta = getX(e) - (frameConfig.resizer.left.getBoundingClientRect().left - frameConfig.canvas.getBoundingClientRect().left),
  document.addEventListener('mouseup', removeLeftResizerListener)
  document.addEventListener('mousemove', onLeftResizerMouseMove)
}

function removeLeftResizerListener () {
  document.removeEventListener('mouseup', removeLeftResizerListener)
  document.removeEventListener('mousemove', onLeftResizerMouseMove)
}

function onLeftResizerMouseMove (e) {
  const left = ensureInFrameBounds(getX(e))
  frameState.left = left - frameState.cursorResizerDelta
  frameConfig.resizer.left.style.left = `${frameState.left}px`
  frameConfig.background.left.style.width = `${frameState.left}px`
}

function onRightResizerMouseDown (e) {
  frameState.cursorResizerDelta = getX(e) - (frameConfig.resizer.right.getBoundingClientRect().left - frameConfig.canvas.getBoundingClientRect().left),
  document.addEventListener('mouseup', removeRightResizerListener)
  document.addEventListener('mousemove', onRightResizerMouseMove)
}

function removeRightResizerListener () {
  document.removeEventListener('mouseup', removeRightResizerListener)
  document.removeEventListener('mousemove', onRightResizerMouseMove)
}

function onRightResizerMouseMove (e) {
  const left = ensureInFrameBounds(getX(e))
  // frameState.right = frameConfig.canvas..
  frameConfig.resizer.right.style.left = `${left - frameState.cursorResizerDelta}px`
  frameConfig.background.right.style.left = `${left - frameState.cursorResizerDelta + frameConfig.resizerWidthPixels}px`
}

function getX (event) {
  const { left } = frameConfig.canvas.getBoundingClientRect()
  return event.clientX - left + window.scrollX - document.documentElement.scrollLeft
}

function ensureInFrameBounds (x) {
  if (x > frameConfig.canvas.width) return frameConfig.canvas.width
  if (x < 0) return 0
  return x
}