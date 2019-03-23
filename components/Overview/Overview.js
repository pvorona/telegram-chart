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
const ELEMENT_CLASS_NAME = 'overview'
const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4

export function Overview (chartConfig, onViewBoxChange, onDragStart, onDragEnd) {
  const overviewContainer = div()
  overviewContainer.className = ELEMENT_CLASS_NAME
  overviewContainer.style.height = `${chartConfig.OVERVIEW_CANVAS_HEIGHT}px`

  const graphs = Graphs(chartConfig, {
    width: chartConfig.OVERVIEW_CANVAS_WIDTH,
    height: chartConfig.OVERVIEW_CANVAS_HEIGHT - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2,
    top: VIEWBOX_TOP_BOTTOM_BORDER_WIDTH,
    strokeStyles: chartConfig.colors,
    lineWidth: chartConfig.OVERVIEW_LINE_WIDTH,
    viewBox: {
      startIndex: 0,
      endIndex: chartConfig.data.total - 1,
    },
  })
  overviewContainer.appendChild(graphs.element)
  const backgroundLeft = createElement('div', { className: 'overview__overflow overview__overflow--left' })
  const backgroundRight = createElement('div', { className: 'overview__overflow overview__overflow--right' })
  const resizerLeft = createElement('div', { className: 'overview__resizer overview__resizer--left' })
  const resizerRight = createElement('div', { className: 'overview__resizer overview__resizer--right' })
  const viewBoxElement = createElement('div', { className: 'overview__viewbox' }, [resizerLeft, resizerRight])
  overviewContainer.appendChild(backgroundLeft)
  overviewContainer.appendChild(backgroundRight)
  overviewContainer.appendChild(viewBoxElement)

  const overviewState = {
    left: chartConfig.renderWindow.startIndex / (chartConfig.data.total - 1) * chartConfig.OVERVIEW_CANVAS_WIDTH,
    right: chartConfig.OVERVIEW_CANVAS_WIDTH,
    cursorResizerDelta: 0,
    cursorViewBoxElementDelta: 0,
  }

  backgroundLeft.style.width = `${overviewState.left}px`
  viewBoxElement.style.left = `${overviewState.left}px`

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
    toggleVisibility: graphs.toggleVisibility,
  }

  function onLeftResizerMouseDown (e) {
    onDragStart()
    document.body.classList.add(classes.left)
    viewBoxElement.classList.add(classes.left)
    overviewState.cursorResizerDelta = getX(e) - (resizerLeft.getBoundingClientRect().left - overviewContainer.getBoundingClientRect().left)
  }

  function removeLeftResizerListener () {
    onDragEnd()
    document.body.classList.remove(classes.left)
    viewBoxElement.classList.remove(classes.left)
  }

  function onLeftResizerMouseMove (e) {
    const left = ensureInOverviewBounds(getX(e) - overviewState.cursorResizerDelta)
    overviewState.left = left > overviewState.right - minimalPixelsBetweenResizers ? (overviewState.right - minimalPixelsBetweenResizers) : left
    backgroundLeft.style.width = `${overviewState.left}px`
    viewBoxElement.style.left = `${overviewState.left}px`
    const startIndex = overviewState.left / chartConfig.OVERVIEW_CANVAS_WIDTH * (chartConfig.data.total - 1)
    onViewBoxChange({ startIndex })
  }

  function onRightResizerMouseDown (e) {
    onDragStart()
    document.body.classList.add(classes.right)
    viewBoxElement.classList.add(classes.right)
    overviewState.cursorResizerDelta = getX(e) - (resizerRight.getBoundingClientRect().right - overviewContainer.getBoundingClientRect().left)
  }

  function removeRightResizerListener () {
    onDragEnd()
    document.body.classList.remove(classes.right)
    viewBoxElement.classList.remove(classes.right)
  }

  function onRightResizerMouseMove (e) {
    const right = ensureInOverviewBounds(getX(e) - overviewState.cursorResizerDelta)
    overviewState.right = right < overviewState.left + minimalPixelsBetweenResizers ? (overviewState.left + minimalPixelsBetweenResizers) : right
    backgroundRight.style.left = `${overviewState.right}px`
    viewBoxElement.style.right = `${chartConfig.OVERVIEW_CANVAS_WIDTH - (overviewState.right)}px`
    const endIndex = (overviewState.right) / chartConfig.OVERVIEW_CANVAS_WIDTH * (chartConfig.data.total - 1)
    onViewBoxChange({ endIndex })
  }

  function getX (event) {
    const { left } = overviewContainer.getBoundingClientRect()
    return event.clientX - left + window.scrollX - document.documentElement.scrollLeft
  }

  function ensureInOverviewBounds (x) {
    if (x > chartConfig.OVERVIEW_CANVAS_WIDTH) return chartConfig.OVERVIEW_CANVAS_WIDTH
    if (x < 0) return 0
    return x
  }

  function onViewBoxElementMouseDown (e) {
    onDragStart()
    overviewState.cursorViewBoxElementDelta = getX(e) - (viewBoxElement.getBoundingClientRect().left - overviewContainer.getBoundingClientRect().left),
    viewBoxElement.classList.add(classes.grabbing)
    document.body.classList.add(classes.grabbing)
    resizerLeft.classList.add(classes.grabbing)
    resizerRight.classList.add(classes.grabbing)
  }

  function onViewBoxElementMouseUp () {
    onDragEnd()
    document.body.classList.remove(classes.grabbing)
    viewBoxElement.classList.remove(classes.grabbing)
    resizerLeft.classList.remove(classes.grabbing)
    resizerRight.classList.remove(classes.grabbing)
  }

  function onViewBoxElementMouseMove (e) {
    const width = overviewState.right - overviewState.left
    const nextLeft = getX(e) - overviewState.cursorViewBoxElementDelta
    if (nextLeft < 0) {
      overviewState.left = 0
    } else if (nextLeft > chartConfig.OVERVIEW_CANVAS_WIDTH - width) {
      overviewState.left = chartConfig.OVERVIEW_CANVAS_WIDTH - width
    } else {
      overviewState.left = nextLeft
    }
    overviewState.right = overviewState.left + width
    viewBoxElement.style.left = `${overviewState.left}px`
    viewBoxElement.style.right = `${chartConfig.OVERVIEW_CANVAS_WIDTH - (overviewState.right)}px`
    backgroundLeft.style.width = `${overviewState.left}px`
    backgroundRight.style.left = `${overviewState.right}px`
    const startIndex = overviewState.left / chartConfig.OVERVIEW_CANVAS_WIDTH * (chartConfig.data.total - 1)
    const endIndex = (overviewState.right) / (chartConfig.OVERVIEW_CANVAS_WIDTH) * (chartConfig.data.total - 1)
    onViewBoxChange({ startIndex, endIndex })
  }
}