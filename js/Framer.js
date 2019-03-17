import { Graphs } from './Graphs'
import { createElement } from './html'

const resizerWidthPixels = 8
const minimalPixelsBetweenResizers = 40
const classes = {
  left: 'cursor-w-resize',
  right: 'cursor-e-resize',
  grabbing: 'cursor-grabbing',
}

export function Framer (parentElement, chartConfig, onViewBoxChange) {
  const frameContainer = document.createElement('div')
  frameContainer.classList.add('overview')
  const [graphs, updateFrameGraphs] = Graphs(chartConfig, {
    width: chartConfig.FRAME_CANVAS_WIDTH,
    height: chartConfig.FRAME_CANVAS_HEIGHT,
    strokeStyles: chartConfig.colors,
    lineWidth: chartConfig.FRAME_LINE_WIDTH,
    viewBox: {
      startIndex: 0,
      endIndex: chartConfig.data.total - 1,
    }
  })
  frameContainer.appendChild(graphs)
  const backgroundLeft = createElement('div', { className: 'overview__overflow overview__overflow--left' })
  const backgroundRight = createElement('div', { className: 'overview__overflow overview__overflow--right' })
  const resizerLeft = createElement('div', { className: 'overview__resizer overview__resizer--left' })
  const resizerRight = createElement('div', { className: 'overview__resizer overview__resizer--right' })
  const framer = createElement('div', { className: 'overview__viewbox' }, [resizerLeft, resizerRight])
  frameContainer.appendChild(backgroundLeft)
  frameContainer.appendChild(backgroundRight)
  frameContainer.appendChild(framer)

  const frameState = {
    left: chartConfig.renderWindow.startIndex / (chartConfig.data.total - 1) * chartConfig.FRAME_CANVAS_WIDTH,
    right: chartConfig.FRAME_CANVAS_WIDTH,
    cursorResizerDelta: 0,
    cursorFramerDelta: 0,
  }

  backgroundLeft.style.width = `${frameState.left}px`
  framer.style.left = `${frameState.left}px`

  resizerLeft.addEventListener('mousedown', onLeftResizerMouseDown)
  resizerRight.addEventListener('mousedown', onRightResizerMouseDown)
  framer.addEventListener('mousedown', onFramerMouseDown)

  parentElement.appendChild(frameContainer)

  return updateFrameGraphs

  function onLeftResizerMouseDown (e) {
    e.stopPropagation()
    e.preventDefault()
    document.body.classList.add(classes.left)
    frameState.cursorResizerDelta = getX(e) - (resizerLeft.getBoundingClientRect().left - frameContainer.getBoundingClientRect().left),
    document.addEventListener('mouseup', removeLeftResizerListener)
    document.addEventListener('mousemove', onLeftResizerMouseMove)
  }

  function removeLeftResizerListener () {
    document.body.classList.remove(classes.left)
    document.removeEventListener('mouseup', removeLeftResizerListener)
    document.removeEventListener('mousemove', onLeftResizerMouseMove)
  }

  function onLeftResizerMouseMove (e) {
    const left = ensureInFrameBounds(getX(e) - frameState.cursorResizerDelta)
    frameState.left = left > frameState.right - minimalPixelsBetweenResizers ? (frameState.right - minimalPixelsBetweenResizers) : left
    backgroundLeft.style.width = `${frameState.left}px`
    framer.style.left = `${frameState.left}px`
    const startIndex = frameState.left / chartConfig.FRAME_CANVAS_WIDTH * (chartConfig.data.total - 1)
    onViewBoxChange({ startIndex })
  }

  function onRightResizerMouseDown (e) {
    e.stopPropagation()
    e.preventDefault()
    document.body.classList.add(classes.right)
    frameState.cursorResizerDelta = getX(e) - (resizerRight.getBoundingClientRect().right - frameContainer.getBoundingClientRect().left),
    document.addEventListener('mouseup', removeRightResizerListener)
    document.addEventListener('mousemove', onRightResizerMouseMove)
  }

  function removeRightResizerListener () {
    document.body.classList.remove(classes.right)
    document.removeEventListener('mouseup', removeRightResizerListener)
    document.removeEventListener('mousemove', onRightResizerMouseMove)
  }

  function onRightResizerMouseMove (e) {
    const right = ensureInFrameBounds(getX(e) - frameState.cursorResizerDelta)
    frameState.right = right < frameState.left + minimalPixelsBetweenResizers ? (frameState.left + minimalPixelsBetweenResizers) : right
    backgroundRight.style.left = `${frameState.right}px`
    framer.style.right = `${chartConfig.FRAME_CANVAS_WIDTH - (frameState.right)}px`
    const endIndex = (frameState.right) / chartConfig.FRAME_CANVAS_WIDTH * (chartConfig.data.total - 1)
    onViewBoxChange({ endIndex })
  }

  function getX (event) {
    const { left } = frameContainer.getBoundingClientRect()
    return event.clientX - left + window.scrollX - document.documentElement.scrollLeft
  }

  function ensureInFrameBounds (x) {
    if (x > chartConfig.FRAME_CANVAS_WIDTH) return chartConfig.FRAME_CANVAS_WIDTH
    if (x < 0) return 0
    return x
  }

  function onFramerMouseDown (e) {
    frameState.cursorFramerDelta = getX(e) - (framer.getBoundingClientRect().left - frameContainer.getBoundingClientRect().left),
    framer.classList.add(classes.grabbing)
    document.body.classList.add(classes.grabbing)
    document.addEventListener('mouseup', onFramerMouseUp)
    document.addEventListener('mousemove', onFramerMouseMove)
  }

  function onFramerMouseUp () {
    document.body.classList.remove(classes.grabbing)
    framer.classList.remove(classes.grabbing)
    document.removeEventListener('mouseup', onFramerMouseUp)
    document.removeEventListener('mousemove', onFramerMouseMove)
  }

  function onFramerMouseMove (e) {
    const width = frameState.right - frameState.left
    const nextLeft = getX(e) - frameState.cursorFramerDelta
    if (nextLeft < 0) {
      frameState.left = 0
    } else if (nextLeft > chartConfig.FRAME_CANVAS_WIDTH - width) {
      frameState.left = chartConfig.FRAME_CANVAS_WIDTH - width
    } else {
      frameState.left = nextLeft
    }
    frameState.right = frameState.left + width
    framer.style.left = `${frameState.left}px`
    framer.style.right = `${chartConfig.FRAME_CANVAS_WIDTH - (frameState.right)}px`
    backgroundLeft.style.width = `${frameState.left}px`
    backgroundRight.style.left = `${frameState.right}px`
    const startIndex = frameState.left / chartConfig.FRAME_CANVAS_WIDTH * (chartConfig.data.total - 1)
    const endIndex = (frameState.right) / (chartConfig.FRAME_CANVAS_WIDTH) * (chartConfig.data.total - 1)
    // console.log(frameState.right / endIndex)
    onViewBoxChange({ startIndex, endIndex })
  }
}