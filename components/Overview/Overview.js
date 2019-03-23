import { DRAG_START, DRAG_END } from '../../events'
import { Graphs } from '../Graphs'
import { createElement, div } from '../html'
import { handleDrag } from '../util'

const resizerWidthPixels = 8
const minimalPixelsBetweenResizers = 40
const classes = {
  left: 'cursor-w-resize',
  right: 'cursor-e-resize',
  grabbing: 'cursor-grabbing',
}

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4

export function Framer (parentElement, chartConfig, onViewBoxChange, eventChannel) {
  const frameContainer = div()
  frameContainer.classList.add('overview')
  frameContainer.style.height = `${chartConfig.FRAME_CANVAS_HEIGHT}px`

  const graphs = Graphs(chartConfig, {
    width: chartConfig.FRAME_CANVAS_WIDTH,
    height: chartConfig.FRAME_CANVAS_HEIGHT - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2,
    top: VIEWBOX_TOP_BOTTOM_BORDER_WIDTH,
    strokeStyles: chartConfig.colors,
    lineWidth: chartConfig.FRAME_LINE_WIDTH,
    viewBox: {
      startIndex: 0,
      endIndex: chartConfig.data.total - 1,
    },
  }, eventChannel)
  frameContainer.appendChild(graphs.element)
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

  handleDrag(resizerLeft, {
    onDragStart: onLeftResizerMouseDown,
    onDragMove: onLeftResizerMouseMove,
    onDragEnd: removeLeftResizerListener,
  })
  handleDrag(resizerRight, {
    onDragStart: onRightResizerMouseDown,
    onDragMove: onRightResizerMouseMove,
    onDragEnd: removeRightResizerListener,
  })
  handleDrag(framer, {
    onDragStart: onFramerMouseDown,
    onDragMove: onFramerMouseMove,
    onDragEnd: onFramerMouseUp,
  })

  parentElement.appendChild(frameContainer)

  return graphs

  function onLeftResizerMouseDown (e) {
    eventChannel.publish(DRAG_START)
    document.body.classList.add(classes.left)
    framer.classList.add(classes.left)
    frameState.cursorResizerDelta = getX(e) - (resizerLeft.getBoundingClientRect().left - frameContainer.getBoundingClientRect().left)
  }

  function removeLeftResizerListener () {
    eventChannel.publish(DRAG_END)
    document.body.classList.remove(classes.left)
    framer.classList.remove(classes.left)
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
    eventChannel.publish(DRAG_START)
    document.body.classList.add(classes.right)
    framer.classList.add(classes.right)
    frameState.cursorResizerDelta = getX(e) - (resizerRight.getBoundingClientRect().right - frameContainer.getBoundingClientRect().left)
  }

  function removeRightResizerListener () {
    eventChannel.publish(DRAG_END)
    document.body.classList.remove(classes.right)
    framer.classList.remove(classes.right)
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
    eventChannel.publish(DRAG_START)
    frameState.cursorFramerDelta = getX(e) - (framer.getBoundingClientRect().left - frameContainer.getBoundingClientRect().left),
    framer.classList.add(classes.grabbing)
    document.body.classList.add(classes.grabbing)
    resizerLeft.classList.add(classes.grabbing)
    resizerRight.classList.add(classes.grabbing)
  }

  function onFramerMouseUp () {
    eventChannel.publish(DRAG_END)
    document.body.classList.remove(classes.grabbing)
    framer.classList.remove(classes.grabbing)
    resizerLeft.classList.remove(classes.grabbing)
    resizerRight.classList.remove(classes.grabbing)
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
    onViewBoxChange({ startIndex, endIndex })
  }
}