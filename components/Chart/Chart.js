import { Title } from '../Title'
import { renderGraphs } from '../Graphs'
import { Controls } from '../Controls'

import { easeInOutQuad, linear } from '../../easings'
import { memoizeObjectArgument, getMaxValue, beautifyNumber, createTransitionGroup, transition } from '../../util'
import { MONTHS } from '../constants'

import { handleDrag } from '../../util'

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4
const resizerWidthPixels = 8
const minimalPixelsBetweenResizers = 40
const classes = {
  left: 'cursor-w-resize',
  right: 'cursor-e-resize',
  grabbing: 'cursor-grabbing',
}


const FRAME = 1000 / 60
// AnimatableState = { startIndex, endIndex, max, ...visibilityState }
// - Durations
// - Easings
// - Multiple renders per frame
// - Overview
// Can remove left right overview state, just use start/end index
export function Chart (options) {
  const state = getInitialState()
  const overviewState = getInitialOverviewState()
  const transitions = createTransitionGroup(createTransitions(), render)
  const { element, overview, graphs } = createDOM()
  const boundingRect = overview.element.getBoundingClientRect()
  const renderMainGraph = memoizeObjectArgument(renderGraphs)
  const renderOverviewGraph = memoizeObjectArgument(renderGraphs)

  initDragListeners()
  render(state)


  return { element }

  function render (state) {
    renderMainGraph({
      ...state,
      context: graphs.context,
      width: options.width,
      height: options.height,
      values: options.data,
      graphNames: options.graphNames,
      lineWidth: options.lineWidth,
      strokeStyles: options.colors,
    })
    renderOverviewGraph({
      ...state,
      max: state.totalMax,
      startIndex: 0,
      endIndex: options.data.total - 1,
      context: overview.graphs.context,
      width: options.OVERVIEW_CANVAS_WIDTH,
      height: options.OVERVIEW_CANVAS_HEIGHT - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2,
      values: options.data,
      graphNames: options.graphNames,
      lineWidth: options.OVERVIEW_LINE_WIDTH,
      strokeStyles: options.colors,
    })
  }

  function setState (newState) {
    Object.assign(state, newState)
    transitions.setTargets({
      ...state,
      max: beautifyNumber(getMaxValueInRange(state.startIndex, state.endIndex, getVisibleGraphNames())),
      totalMax: getMaxValueInRange(0, options.data.total - 1, getVisibleGraphNames()),
    })
  }

  function setOverviewState (newState) {
    Object.assign(overviewState, newState)
    if ('left' in newState) {
      overview.viewBoxElement.style.left = `${overviewState.left}px`
    }
    if ('right' in newState) {
      overview.viewBoxElement.style.right = `${options.width - overviewState.right}px`
    }
    if ('left' in newState || 'right' in newState) {
      const startIndex = overviewState.left / options.width * (options.data.total - 1)
      const endIndex = overviewState.right / options.width * (options.data.total - 1)
      setState({ startIndex, endIndex })
    }
  }

  function onButtonClick (graphName) {
    setState({
      [getVisibilityKey(graphName)]: state[getVisibilityKey(graphName)] === 0 ? 1 : 0
    })
  }

  function getInitialState () {
    return {
      startIndex: options.viewBox.startIndex,
      endIndex: options.viewBox.endIndex,
      max: beautifyNumber(getMaxValueInRange(options.viewBox.startIndex, options.viewBox.endIndex, options.graphNames)),
      totalMax: getMaxValueInRange(0, options.data.total - 1, options.graphNames),
      ...getVisibilityState(),
    }
  }

  function getInitialOverviewState () {
    return {
       left: options.viewBox.startIndex / (options.data.total - 1) * options.width,
       right: options.width,
       cursorResizerDelta: 0,
     }
  }

  function createTransitions () {
    return {
      startIndex: transition(state.startIndex, FRAME * 4, linear),
      endIndex: transition(state.endIndex, FRAME * 4, linear),
      max: transition(state.max, FRAME * 20, easeInOutQuad),
      totalMax: transition(state.totalMax, FRAME * 20, easeInOutQuad),
      ...options.graphNames.reduce((transitions, graphName) => ({
        ...transitions,
        [getVisibilityKey(graphName)]: transition(1, FRAME * 20, easeInOutQuad),
      }), {})
    }
  }

  function initDragListeners () {
    handleDrag(overview.resizerLeft, {
      onDragStart: onLeftResizerMouseDown,
      onDragMove: onLeftResizerMouseMove,
      onDragEnd: removeLeftResizerListener,
    })
    handleDrag(overview.resizerRight, {
      onDragStart: onRightResizerMouseDown,
      onDragMove: onRightResizerMouseMove,
      onDragEnd: removeRightResizerListener,
    })
    handleDrag(overview.viewBoxElement, {
      onDragStart: onViewBoxElementMouseDown,
      onDragMove: onViewBoxElementMouseMove,
      onDragEnd: onViewBoxElementMouseUp,
    })
  }

  function getVisibilityState () {
    return options.graphNames.reduce((visibilityState, graphName) => ({
      ...visibilityState,
      [getVisibilityKey(graphName)]: 1,
    }), {})
  }

  function getMaxValueInRange (startIndex, endIndex, graphNames) {
    return getMaxValue(
      { startIndex, endIndex },
      getValues(graphNames),
    )
  }

  function getValues (graphNames) {
    return graphNames.map(graphName => options.data[graphName])
  }

  function getVisibleGraphNames () {
    return options.graphNames.filter(graphName => state[getVisibilityKey(graphName)])
  }

  function applyCursor (className) {
    [document.body, overview.viewBoxElement, overview.resizerLeft, overview.resizerRight].forEach(
      element => element.classList.toggle(className)
    )
  }

  function onLeftResizerMouseDown (e) {
    applyCursor(classes.left)
    setOverviewState({
      cursorResizerDelta: getX(e) - (overviewState.left - boundingRect.left)
    })
  }

  function removeLeftResizerListener () {
    applyCursor(classes.left)
  }

  function onLeftResizerMouseMove (e) {
    const left = ensureInOverviewBounds(getX(e) - overviewState.cursorResizerDelta)
    setOverviewState({
      left: keepInBounds(left, 0, overviewState.right - minimalPixelsBetweenResizers)
    })
  }

  function onRightResizerMouseDown (e) {
    applyCursor(classes.right)
    setOverviewState({
      cursorResizerDelta: getX(e) - (overviewState.right - boundingRect.left)
    })
  }

  function removeRightResizerListener () {
    applyCursor(classes.right)
  }

  function onRightResizerMouseMove (e) {
    const right = ensureInOverviewBounds(getX(e) - overviewState.cursorResizerDelta)
    setOverviewState({
      right: keepInBounds(right, overviewState.left + minimalPixelsBetweenResizers, right)
    })
  }

  function getX (event) {
    return event.clientX - boundingRect.left
  }

  function ensureInOverviewBounds (x) {
    return keepInBounds(x, 0, options.width)
  }

  function onViewBoxElementMouseDown (e) {
    applyCursor(classes.grabbing)
    setOverviewState({
      cursorResizerDelta: getX(e) - (overviewState.left - boundingRect.left),
    })
  }

  function onViewBoxElementMouseUp () {
    applyCursor(classes.grabbing)
  }

  function onViewBoxElementMouseMove (e) {
    const width = overviewState.right - overviewState.left
    const nextLeft = getX(e) - overviewState.cursorResizerDelta
    const stateLeft = keepInBounds(nextLeft, 0, options.width - width)
    setOverviewState({
      left: stateLeft,
      right: stateLeft + width,
    })
  }

  function createDOM () {
    const element = document.createElement('div')
    element.style.marginTop = '110px'
    const title = Title(options.title)
    const graphs = createGraphs({
      width: options.width,
      height: options.height,
    })
    const overview = createOverview()
    const controls = Controls(options, onButtonClick)
    element.appendChild(title)
    element.appendChild(graphs.element)
    element.appendChild(overview.element)
    element.appendChild(controls)

    return { graphs, element, overview }
  }

  function createGraphs ({ width, height }) {
    const containerClassName = 'graphs'
    const element = document.createElement('div')
    element.style.width = `${width}px`
    element.style.height = `${height}px`
    element.className = containerClassName
    const canvas = document.createElement('canvas')
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    const context = canvas.getContext('2d')
    element.appendChild(canvas)

    return { element, context }
  }

  function createOverview () {
    const containerClassName = 'overview'
    const element = document.createElement('div')
    element.className = containerClassName
    element.style.height = `${options.OVERVIEW_CANVAS_HEIGHT}px`
    element.style.width = `${options.OVERVIEW_CANVAS_WIDTH}px`
    const resizerLeft = document.createElement('div')
    resizerLeft.className = 'overview__resizer overview__resizer--left'
    const resizerRight = document.createElement('div')
    resizerRight.className = 'overview__resizer overview__resizer--right'
    const viewBoxElement = document.createElement('div')
    viewBoxElement.className ='overview__viewbox'
    viewBoxElement.style.left = `${overviewState.left}px`
    viewBoxElement.appendChild(resizerLeft)
    viewBoxElement.appendChild(resizerRight)
    const graphs = createGraphs({
      width: options.OVERVIEW_CANVAS_WIDTH,
      height: options.OVERVIEW_CANVAS_HEIGHT,
    })
    element.appendChild(graphs.element)
    element.appendChild(viewBoxElement)
    return { element, resizerLeft, resizerRight, viewBoxElement, graphs }
  }
}

function getVisibilityKey (name) {
  return `${name}_opacity`
}

function keepInBounds (value, min, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}