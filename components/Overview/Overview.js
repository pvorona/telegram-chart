import { Graphs } from '../Graphs'
import { createElement, div } from '../html'
import { handleDrag } from '../../util'

const resizerWidthPixels = 8
const minimalPixelsBetweenResizers = 40
const classes = {
  left: 'cursor-w-resize',
  right: 'cursor-e-resize',
  grabbing: 'cursor-grabbing',
}
const containerClassName = 'overview'
const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4

export function Overview (chartConfig, onViewBoxChange, onDragStart, onDragEnd) {
  const state = getInitialState()
  const { overviewContainer, resizerLeft, resizerRight, viewBoxElement } = createDOM()

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
  handleDrag(viewBoxElement, {
    onDragStart: onViewBoxElementMouseDown,
    onDragMove: onViewBoxElementMouseMove,
    onDragEnd: onViewBoxElementMouseUp,
  })

  return {
    element: overviewContainer,
  }

  function applyCursor (className) {
    [document.body, viewBoxElement, resizerLeft, resizerRight].forEach(element =>
      element.classList.toggle(className)
    )
  }

  function onLeftResizerMouseDown (e) {
    onDragStart()
    applyCursor(classes.left)
    state.cursorResizerDelta = getX(e) - (resizerLeft.getBoundingClientRect().left - overviewContainer.getBoundingClientRect().left)
  }

  function removeLeftResizerListener () {
    onDragEnd()
    applyCursor(classes.left)
  }

  function onLeftResizerMouseMove (e) {
    const left = ensureInOverviewBounds(getX(e) - state.cursorResizerDelta)
    state.left = left > state.right - minimalPixelsBetweenResizers ? (state.right - minimalPixelsBetweenResizers) : left
    viewBoxElement.style.left = `${state.left}px`
    const startIndex = state.left / chartConfig.width * (chartConfig.data.total - 1)
    onViewBoxChange({ startIndex })
  }

  function onRightResizerMouseDown (e) {
    onDragStart()
    applyCursor(classes.right)
    state.cursorResizerDelta = getX(e) - (resizerRight.getBoundingClientRect().right - overviewContainer.getBoundingClientRect().left)
  }

  function removeRightResizerListener () {
    onDragEnd()
    applyCursor(classes.right)
  }

  function onRightResizerMouseMove (e) {
    const right = ensureInOverviewBounds(getX(e) - state.cursorResizerDelta)
    state.right = right < state.left + minimalPixelsBetweenResizers ? (state.left + minimalPixelsBetweenResizers) : right
    viewBoxElement.style.right = `${chartConfig.width - (state.right)}px`
    const endIndex = (state.right) / chartConfig.width * (chartConfig.data.total - 1)
    onViewBoxChange({ endIndex })
  }

  function getX (event) {
    const { left } = overviewContainer.getBoundingClientRect()
    return event.clientX - left
  }

  function ensureInOverviewBounds (x) {
    if (x > chartConfig.width) return chartConfig.width
    if (x < 0) return 0
    return x
  }

  function onViewBoxElementMouseDown (e) {
    onDragStart()
    state.cursorResizerDelta = getX(e) - (viewBoxElement.getBoundingClientRect().left - overviewContainer.getBoundingClientRect().left),
    applyCursor(classes.grabbing)
  }

  function onViewBoxElementMouseUp () {
    onDragEnd()
    applyCursor(classes.grabbing)
  }

  function onViewBoxElementMouseMove (e) {
    const width = state.right - state.left
    const nextLeft = getX(e) - state.cursorResizerDelta
    if (nextLeft < 0) {
      state.left = 0
    } else if (nextLeft > chartConfig.width - width) {
      state.left = chartConfig.width - width
    } else {
      state.left = nextLeft
    }
    state.right = state.left + width
    viewBoxElement.style.left = `${state.left}px`
    viewBoxElement.style.right = `${chartConfig.width - (state.right)}px`
    const startIndex = state.left / chartConfig.width * (chartConfig.data.total - 1)
    const endIndex = (state.right) / (chartConfig.width) * (chartConfig.data.total - 1)
    onViewBoxChange({ startIndex, endIndex })
  }

  function getInitialState () {
    return {
       left: chartConfig.viewBox.startIndex / (chartConfig.data.total - 1) * chartConfig.width,
       right: chartConfig.width,
       cursorResizerDelta: 0,
     }
  }

  function createDOM () {
    const overviewContainer = document.createElement('div')
    overviewContainer.className = containerClassName
    overviewContainer.style.height = `${chartConfig.height}px`
    overviewContainer.style.width = `${chartConfig.width}px`
    const resizerLeft = document.createElement('div')
    resizerLeft.className = 'overview__resizer overview__resizer--left'
    const resizerRight = document.createElement('div')
    resizerRight.className = 'overview__resizer overview__resizer--right'
    const viewBoxElement = document.createElement('div')
    viewBoxElement.className ='overview__viewbox'
    viewBoxElement.style.left = `${state.left}px`
    viewBoxElement.appendChild(resizerLeft)
    viewBoxElement.appendChild(resizerRight)
    const graphs = createGraphs()
    overviewContainer.appendChild(graphs.element)
    overviewContainer.appendChild(viewBoxElement)
    return { overviewContainer, resizerLeft, resizerRight, viewBoxElement }
  }

  function createGraphs () {
    return Graphs({
      graphNames: chartConfig.graphNames,
      values: chartConfig.data,
      width: chartConfig.width,
      height: chartConfig.height - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2,
      strokeStyles: chartConfig.colors,
      lineWidth: chartConfig.lineWidth,
      startIndex: 0,
      endIndex: chartConfig.data.total - 1,
    })
  }
}