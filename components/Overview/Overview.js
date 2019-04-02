import { Graphs } from '../Graphs'
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

export function Overview (config, setViewBox, onDragStart, onDragEnd) {
  const state = getInitialState()
  const { element, resizerLeft, resizerRight, viewBoxElement } = createDOM()
  const boundingRect = element.getBoundingClientRect()

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

  return { element }

  function applyCursor (className) {
    [document.body, viewBoxElement, resizerLeft, resizerRight].forEach(
      element => element.classList.toggle(className)
    )
  }

  function setState (newState) {
    Object.assign(state, newState)
    if (newState.left !== undefined) {
      viewBoxElement.style.left = `${state.left}px`
    }
    if (newState.right) {
      viewBoxElement.style.right = `${config.width - state.right}px`
    }
    if (newState.left || newState.right) {
      const startIndex = state.left / config.width * (config.data.total - 1)
      const endIndex = state.right / config.width * (config.data.total - 1)
      setViewBox({ startIndex, endIndex })
    }
  }

  function onLeftResizerMouseDown (e) {
    onDragStart()
    applyCursor(classes.left)
    setState({
      cursorResizerDelta: getX(e) - (state.left - boundingRect.left)
    })
  }

  function removeLeftResizerListener () {
    onDragEnd()
    applyCursor(classes.left)
  }

  function onLeftResizerMouseMove (e) {
    const left = ensureInOverviewBounds(getX(e) - state.cursorResizerDelta)
    setState({
      left: keepInBounds(left, 0, state.right - minimalPixelsBetweenResizers)
    })
  }

  function onRightResizerMouseDown (e) {
    onDragStart()
    applyCursor(classes.right)
    setState({
      cursorResizerDelta: getX(e) - (state.right - boundingRect.left)
    })
  }

  function removeRightResizerListener () {
    onDragEnd()
    applyCursor(classes.right)
  }

  function onRightResizerMouseMove (e) {
    const right = ensureInOverviewBounds(getX(e) - state.cursorResizerDelta)
    setState({
      right: keepInBounds(right, state.left + minimalPixelsBetweenResizers, right)
    })
  }

  function getX (event) {
    return event.clientX - boundingRect.left
  }

  function ensureInOverviewBounds (x) {
    if (x > config.width) return config.width
    if (x < 0) return 0
    return x
  }

  function onViewBoxElementMouseDown (e) {
    onDragStart()
    applyCursor(classes.grabbing)
    setState({
      cursorResizerDelta: getX(e) - (state.left - boundingRect.left),
    })
  }

  function onViewBoxElementMouseUp () {
    onDragEnd()
    applyCursor(classes.grabbing)
  }

  function onViewBoxElementMouseMove (e) {
    const width = state.right - state.left
    const nextLeft = getX(e) - state.cursorResizerDelta
    const stateLeft = keepInBounds(nextLeft, 0, config.width - width)
    setState({
      left: stateLeft,
      right: stateLeft + width,
    })
  }

  function getInitialState () {
    return {
       left: config.viewBox.startIndex / (config.data.total - 1) * config.width,
       right: config.width,
       cursorResizerDelta: 0,
     }
  }

  function createDOM () {
    const element = document.createElement('div')
    element.className = containerClassName
    element.style.height = `${config.height}px`
    element.style.width = `${config.width}px`
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
    element.appendChild(graphs.element)
    element.appendChild(viewBoxElement)
    return { element, resizerLeft, resizerRight, viewBoxElement }
  }

  function createGraphs () {
    return Graphs({
      graphNames: config.graphNames,
      values: config.data,
      width: config.width,
      height: config.height - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2,
      strokeStyles: config.colors,
      lineWidth: config.lineWidth,
      startIndex: 0,
      endIndex: config.data.total - 1,
      max: config.max,
    })
  }
}

function keepInBounds (value, min, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}