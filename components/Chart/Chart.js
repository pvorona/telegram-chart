import { renderGraphs } from '../Graphs'
import { Controls } from '../Controls'

import { easeInOutQuart, linear } from '../../easings'
import { mapDataToCoords, memoizeObjectArgument, getMaxValue, beautifyNumber, createTransitionGroup, transition } from '../../util'
import { MONTHS } from '../constants'

import { handleDrag, memoizeOne } from '../../util'

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4
const resizerWidthPixels = 8
const minimalPixelsBetweenResizers = 40
const classes = {
  grabbing: 'cursor-grabbing',
  resize: 'cursor-ew-resize'
}


const FRAME = 1000 / 60
// AnimatableState = { startIndex, endIndex, max, ...visibilityState }
// - Durations
// - Easings
// - Multiple renders per frame
// - Overview
// Can remove left right overview state, just use start/end index
// Use divs for buttons
// move mapDataToCoords up
// - change easings when dragging viewbox
// - bug: tooltip appears on 0 index
export function Chart (options) {
  const state = getInitialState()
  const overviewState = getInitialOverviewState()
  const instantState = getInitialInstantState()
  const transitions = createTransitionGroup(createTransitions(), render)
  const { element, overview, graphs, tooltipLine } = createDOM()
  const renderMainGraph = memoizeObjectArgument(renderGraphs)
  const renderOverviewGraph = memoizeObjectArgument(renderGraphs)
  const boundingRect = overview.element.getBoundingClientRect()
  const points = {}

  initDragListeners()
  render(state)

  const getGraphsBoundingRect = memoizeOne(function getGraphsBoundingRect () {
    return graphs.element.getBoundingClientRect()
  })

  const setTooltipVisibe = memoizeOne(function setTooltipVisibe (visible) {
    tooltipLine.style.visibility = visible ? 'visible' : ''
  })

  const setTooltipPosition = memoizeOne(function setTooltipPosition (index) {
    const { x } = points[options.graphNames[0]][index]
    tooltipLine.style.transform = `translateX(${x / devicePixelRatio - 1 / 2}px)`
  })

  return { element }

  function render (state) {
    for (let i = 0; i < options.graphNames.length; i++) {
      points[options.graphNames[i]] = mapDataToCoords(
        options.data[options.graphNames[i]],
        state.max,
        { width: options.width * devicePixelRatio, height: options.height * devicePixelRatio },
        { startIndex: state.startIndex, endIndex: state.endIndex },
        options.lineWidth * devicePixelRatio,
      )
    }

    renderMainGraph({
      ...state,
      points,
      context: graphs.context,
      width: options.width,
      height: options.height,
      values: options.data,
      graphNames: options.graphNames,
      lineWidth: options.lineWidth,
      strokeStyles: options.colors,
    })
    // renderOverviewGraph({
    //   ...state,
    //   max: state.totalMax,
    //   startIndex: 0,
    //   endIndex: options.data.total - 1,
    //   context: overview.graphs.context,
    //   width: options.overviewWidth,
    //   height: options.overviewHeight - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2,
    //   values: options.data,
    //   graphNames: options.graphNames,
    //   lineWidth: options.OVERVIEW_LINE_WIDTH,
    //   strokeStyles: options.colors,
    // })
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

  function setInstantState (newState) {
    Object.assign(instantState, newState)
    setTooltipVisibe(!instantState.dragging && instantState.hovering)
    setTooltipPosition(instantState.tooltipIndex)
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

  function getInitialInstantState () {
    return {
      dragging: false,
      hovering: false,
      tooltipIndex: 0,
    }
  }

  function createTransitions () {
    return {
      startIndex: transition(state.startIndex, FRAME * 4, linear),
      endIndex: transition(state.endIndex, FRAME * 4, linear),
      max: transition(state.max, FRAME * 36, easeInOutQuart),
      totalMax: transition(state.totalMax, FRAME * 36, easeInOutQuart),
      ...options.graphNames.reduce((transitions, graphName) => ({
        ...transitions,
        [getVisibilityKey(graphName)]: transition(1, FRAME * 36, easeInOutQuart),
      }), {})
    }
  }

  function initDragListeners () {
    graphs.element.addEventListener('mouseenter', function (e) {
      setInstantState({ hovering: true })
    })
    graphs.element.addEventListener('mouseleave', function (e) {
      setInstantState({ hovering: false })
    })
    graphs.element.addEventListener('mousemove', function (e) {
      const x = e.clientX - getGraphsBoundingRect().left
      const index = findClosestPointsIndex(x)
      setInstantState({ tooltipIndex: index })
    })
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

  function findClosestPointsIndex (x) {
    let closestPointIndex = 0
    for (let i = 1; i < points[options.graphNames[0]].length; i++) {
      const distance = Math.abs(points[options.graphNames[0]][i].x / devicePixelRatio - x)
      const closesDistance = Math.abs(points[options.graphNames[0]][closestPointIndex].x / devicePixelRatio - x)
      if (distance < closesDistance) closestPointIndex = i
    }
    return closestPointIndex
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
    applyCursor(classes.resize)
    setInstantState({ dragging: true })
    setOverviewState({
      cursorResizerDelta: getX(e) - (overviewState.left - boundingRect.left)
    })
  }

  function removeLeftResizerListener () {
    applyCursor(classes.resize)
    setInstantState({ dragging: false })
  }

  function onLeftResizerMouseMove (e) {
    const left = ensureInOverviewBounds(getX(e) - overviewState.cursorResizerDelta)
    setOverviewState({
      left: keepInBounds(left, 0, overviewState.right - minimalPixelsBetweenResizers)
    })
  }

  function onRightResizerMouseDown (e) {
    applyCursor(classes.resize)
    setInstantState({ dragging: true })
    setOverviewState({
      cursorResizerDelta: getX(e) - (overviewState.right - boundingRect.left)
    })
  }

  function removeRightResizerListener () {
    applyCursor(classes.resize)
    setInstantState({ dragging: false })
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
    setInstantState({ dragging: true })
    setOverviewState({
      cursorResizerDelta: getX(e) - (overviewState.left - boundingRect.left),
    })
  }

  function onViewBoxElementMouseUp () {
    applyCursor(classes.grabbing)
    setInstantState({ dragging: false })
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
    const title = document.createElement('div')
    title.className = 'title'
    title.innerText = options.title
    const graphs = createGraphs({
      width: options.width,
      height: options.height,
    })
    const overview = createOverview()
    const controls = Controls(options, onButtonClick)
    const tooltipLine = document.createElement('div')
    tooltipLine.className = 'tooltip-line'
    graphs.element.appendChild(tooltipLine)

    element.appendChild(title)
    element.appendChild(graphs.element)
    element.appendChild(overview.element)
    element.appendChild(controls)

    return { graphs, element, overview, tooltipLine }
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
    element.style.height = `${options.overviewHeight}px`
    element.style.width = `${options.overviewWidth}px`
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
      width: options.overviewWidth,
      height: options.overviewHeight,
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