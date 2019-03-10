const frameConfig = {
  resizerWidthPixels: 8,
  minimalPixelsBetweenResizers: 40,
  canvas: document.querySelector('#frame'),
  framer: document.querySelector('#framer'),
  resizer: {
    left: document.querySelector('.frame__resizer-left'),
    right: document.querySelector('.frame__resizer-right'),
  },
  background: {
    left: document.querySelector('.frame__background-left'),
    right: document.querySelector('.frame__background-right'),
  },
  classes: {
    left: 'cursor-w-resize',
    right: 'cursor-e-resize',
    grabbing: 'cursor-grabbing',
  },
}

const frameState = {
  left: 0,
  right: frameConfig.canvas.width - frameConfig.resizerWidthPixels,
  cursorResizerDelta: 0,
  cursorFramerDelta: 0,
}


function initFrame () {
  frameConfig.resizer.left.addEventListener('mousedown', onLeftResizerMouseDown)
  frameConfig.resizer.right.addEventListener('mousedown', onRightResizerMouseDown)
  frameConfig.framer.addEventListener('mousedown', onFramerMouseDown)
}

function onLeftResizerMouseDown (e) {
  e.stopPropagation()
  document.body.classList.add(frameConfig.classes.left)
  frameState.cursorResizerDelta = getX(e) - (frameConfig.resizer.left.getBoundingClientRect().left - frameConfig.canvas.getBoundingClientRect().left),
  document.addEventListener('mouseup', removeLeftResizerListener)
  document.addEventListener('mousemove', onLeftResizerMouseMove)
}

function removeLeftResizerListener () {
  document.body.classList.remove(frameConfig.classes.left)
  document.removeEventListener('mouseup', removeLeftResizerListener)
  document.removeEventListener('mousemove', onLeftResizerMouseMove)
}

function onLeftResizerMouseMove (e) {
  const left = ensureInFrameBounds(getX(e) - frameState.cursorResizerDelta)
  frameState.left = left > frameState.right - frameConfig.minimalPixelsBetweenResizers ? (frameState.right - frameConfig.minimalPixelsBetweenResizers) : left
  // frameConfig.resizer.left.style.left = `${frameState.left}px`
  frameConfig.background.left.style.width = `${frameState.left}px`
  frameConfig.framer.style.left = `${frameState.left}px`
  console.log(frameState.left / frameConfig.canvas.width * 113)
  render(
    undefined,
    { startIndex: Math.floor(frameState.left / frameConfig.canvas.width * 113), endIndex: 112 },
  )
}

function onRightResizerMouseDown (e) {
  e.stopPropagation()
  document.body.classList.add(frameConfig.classes.right)
  frameState.cursorResizerDelta = getX(e) - (frameConfig.resizer.right.getBoundingClientRect().left - frameConfig.canvas.getBoundingClientRect().left),
  document.addEventListener('mouseup', removeRightResizerListener)
  document.addEventListener('mousemove', onRightResizerMouseMove)
}

function removeRightResizerListener () {
  document.body.classList.remove(frameConfig.classes.right)
  document.removeEventListener('mouseup', removeRightResizerListener)
  document.removeEventListener('mousemove', onRightResizerMouseMove)
}

function onRightResizerMouseMove (e) {
  const right = ensureInFrameBounds(getX(e) - frameState.cursorResizerDelta)
  frameState.right = right < frameState.left + frameConfig.minimalPixelsBetweenResizers ? (frameState.left + frameConfig.minimalPixelsBetweenResizers) : right
  // frameConfig.resizer.right.style.left = `${left}px`
  frameConfig.background.right.style.left = `${frameState.right + frameConfig.resizerWidthPixels}px`
  // framer.style.width = `${frameState.right - frameState.left}px`
  frameConfig.framer.style.right = `${frameConfig.canvas.width - (frameState.right + frameConfig.resizerWidthPixels)}px`
  // framer.style.right = `calc(100% - ${frameState.right + frameConfig.resizerWidthPixels}px)`
}

function getX (event) {
  const { left } = frameConfig.canvas.getBoundingClientRect()
  return event.clientX - left + window.scrollX - document.documentElement.scrollLeft
}

function ensureInFrameBounds (x) {
  if (x > frameConfig.canvas.width - frameConfig.resizerWidthPixels) return frameConfig.canvas.width - frameConfig.resizerWidthPixels
  if (x < 0) return 0
  return x
}

function onFramerMouseDown (e) {
  frameState.cursorFramerDelta = getX(e) - (frameConfig.framer.getBoundingClientRect().left - frameConfig.canvas.getBoundingClientRect().left),
  frameConfig.framer.classList.add(frameConfig.classes.grabbing)
  document.body.classList.add(frameConfig.classes.grabbing)
  document.addEventListener('mouseup', onFramerMouseUp)
  document.addEventListener('mousemove', onFramerMouseMove)
}

function onFramerMouseUp () {
  document.body.classList.remove(frameConfig.classes.grabbing)
  frameConfig.framer.classList.remove(frameConfig.classes.grabbing)
  document.removeEventListener('mouseup', onFramerMouseUp)
  document.removeEventListener('mousemove', onFramerMouseMove)
}

function onFramerMouseMove (e) {
  const width = frameState.right - frameState.left
  const nextLeft = getX(e) - frameState.cursorFramerDelta
  if (nextLeft < 0) {
    frameState.left = 0
  } else if (nextLeft + width > frameConfig.canvas.width - frameConfig.resizerWidthPixels) {
    frameState.left = frameConfig.canvas.width - width - frameConfig.resizerWidthPixels
  } else {
    frameState.left = nextLeft
  }
  frameState.right = frameState.left + width
  frameConfig.framer.style.left = `${frameState.left}px`
  frameConfig.framer.style.right = `${frameConfig.canvas.width - (frameState.right + frameConfig.resizerWidthPixels)}px`
  frameConfig.background.left.style.width = `${frameState.left}px`
  frameConfig.background.right.style.left = `${frameState.right + frameConfig.resizerWidthPixels}px`
}