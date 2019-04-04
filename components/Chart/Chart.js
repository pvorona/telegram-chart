import { renderGraphs } from '../Graphs'
import { Controls } from '../Controls'

import { easeInOutQuart, linear } from '../../easings'
import { getShortNumber, mapDataToCoords, memoizeObjectArgument, getMaxValue, beautifyNumber, createTransitionGroup, transition } from '../../util'
import { MONTHS, DAYS } from '../constants'

import { handleDrag, memoizeOne } from '../../util'

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4
const resizerWidthPixels = 8
const minimalPixelsBetweenResizers = 40
const classes = {
  grabbing: 'cursor-grabbing',
  resize: 'cursor-ew-resize'
}

const DOT_BORDER_SIZE = 2
const DOT_SIZE = 10
const CENTER_OFFSET = - DOT_SIZE / 2 - DOT_BORDER_SIZE

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
  const getComputedState = memoizeObjectArgument(function getComputedState ({ left, right, visibleGraphNames }) {
    const startIndex = left / options.width * (options.data.total - 1)
    const endIndex = right / options.width * (options.data.total - 1)

    return {
      startIndex,
      endIndex,
      max: beautifyNumber(getMaxValueInRange(startIndex, endIndex, visibleGraphNames)),
      totalMax: getMaxValueInRange(0, options.data.total - 1, visibleGraphNames),
    }
  })

  const state = getInitialState()
  const computedState = getComputedState({
    left: state.left,
    right: state.right,
    // Always recalculated, never memoized
    // Maybe separate visibility state with all other state?
    visibleGraphNames: getVisibleGraphNames(),
  })
  const instantState = getInitialInstantState()
  const transitions = createTransitionGroup(createTransitions(), setState)
  const { element, overview, graphs, tooltip, tooltipLine, tooltipCircles, tooltipValues, tooltipGraphInfo, tooltipDate } = createDOM()
  const renderMainGraph = memoizeObjectArgument(renderGraphs)
  const renderOverviewGraph = memoizeObjectArgument(renderGraphs)
  const boundingRect = overview.element.getBoundingClientRect()
  let cursorResizerDelta = 0

  initDragListeners()

  const getGraphsBoundingRect = memoizeOne(function getGraphsBoundingRect () {
    return graphs.element.getBoundingClientRect()
  })

  const setTooltipVisibe = memoizeOne(function setTooltipVisibe (visible) {
    tooltipLine.style.visibility = visible ? 'visible' : ''
    tooltip.style.visibility = visible ? 'visible' : ''
    const visibleGraphNames = getVisibleGraphNames()
    options.graphNames.forEach(graphName =>
      tooltipCircles[graphName].style.visibility = visible && visibleGraphNames.indexOf(graphName) > -1 ?'visible' : ''
    )
    options.graphNames.forEach(graphName =>
      tooltipGraphInfo[graphName].hidden = visibleGraphNames.indexOf(graphName) > - 1 ? false : true
    )
  })

  const setTooltipPosition = memoizeOne(function setTooltipPosition (index, points) {
    const visibleGraphNames = getVisibleGraphNames()
    const { x, y } = points[options.graphNames[0]][index]
    tooltipLine.style.transform = `translateX(${x / devicePixelRatio - 1 / 2}px)`
    const dataIndex = index + Math.floor(state.startIndex)
    for (let i = 0; i < visibleGraphNames.length; i++) {
      const { x, y } = points[visibleGraphNames[i]][index]
      tooltipCircles[visibleGraphNames[i]].style.transform = `translateX(${x / devicePixelRatio + CENTER_OFFSET}px) translateY(${y / devicePixelRatio + CENTER_OFFSET}px)`
      tooltipValues[visibleGraphNames[i]].innerText = getShortNumber(options.data[visibleGraphNames[i]][dataIndex])
    }
    tooltipDate.innerText = getTooltipDateText(options.domain[dataIndex])
    // TODO: Force reflow
    tooltip.style.transform = `translateX(${x / devicePixelRatio - tooltip.offsetWidth / 2}px)`
  })

  const setViewBoxLeft = memoizeOne(function setViewBoxLeft (left) {
    overview.viewBoxElement.style.left = `${left}px`
  })

  const setViewBoxRight = memoizeOne(function setViewBoxRight (right) {
    overview.viewBoxElement.style.right = `${options.width - right}px`
  })

  const computePoints = memoizeOne(function (startIndex, endIndex, max) {
    return options.graphNames.reduce((points, graphName) => ({
      ...points,
      [graphName]: mapDataToCoords(
        options.data[graphName],
        max,
        { width: options.width * devicePixelRatio, height: options.height * devicePixelRatio },
        { startIndex, endIndex },
        options.lineWidth * devicePixelRatio,
      )
    }), {})
  })

  const renderMyGraphs = memoizeObjectArgument(function renderMyGraphs ({
    startIndex,
    endIndex,
    points,
  }) {
    renderMainGraph({
      points,
      context: graphs.context,
      width: options.width,
      height: options.height,
      graphNames: options.graphNames,
      lineWidth: options.lineWidth,
      strokeStyles: options.colors,
    })
  })

  renderMyGraphs({
    startIndex: state.startIndex,
    endIndex: state.endIndex,
    points: computePoints(computedState.startIndex, computedState.endIndex, computedState.max),
  })


  return { element }

  function render (state) {
    renderMainGraph({
      ...state,
      points,
      context: graphs.context,
      width: options.width,
      height: options.height,
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
    Object.assign(computedState, getComputedState({
      left: state.left,
      right: state.right,
      // Always recalculated, never memoized
      // Maybe separate visibility state with all other state?
      visibleGraphNames: getVisibleGraphNames(),
    }))

    setViewBoxLeft(state.left)
    setViewBoxRight(state.right)
    setTransitionTargets(getComputedState())
    renderMyGraphs({
      startIndex: state.startIndex,
      endIndex: state.endIndex,
      points: computePoints(computedState.startIndex, computedState.endIndex, computedState.max)
    })
  }


  function setTransitionTargets (targets) {
    transitions.setTargets(targets)
  }

  function setInstantState (newState) {
    Object.assign(instantState, newState)
    const tooltipVisible = !instantState.dragging && instantState.hovering && Boolean(getVisibleGraphNames().length)
    setTooltipVisibe(tooltipVisible)
    tooltipVisible && setTooltipPosition(instantState.tooltipIndex, instantState.points)
  }

  function onButtonClick (graphName) {
    setTransitionTargets({
      [getVisibilityKey(graphName)]: state[getVisibilityKey(graphName)] === 0 ? 1 : 0
    })
  }

  function getInitialState () {
    return {
      startIndex: options.viewBox.startIndex,
      endIndex: options.viewBox.endIndex,
      max: beautifyNumber(getMaxValueInRange(options.viewBox.startIndex, options.viewBox.endIndex, options.graphNames)),
      totalMax: getMaxValueInRange(0, options.data.total - 1, options.graphNames),
      left: options.viewBox.startIndex / (options.data.total - 1) * options.width,
      right: options.width,

      ...getVisibilityState(),
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
    for (let i = 1; i < instantState.points[options.graphNames[0]].length; i++) {
      const distance = Math.abs(instantState.
points[options.graphNames[0]][i].x / devicePixelRatio - x)
      const closesDistance = Math.abs(instantState.
points[options.graphNames[0]][closestPointIndex].x / devicePixelRatio - x)
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
    cursorResizerDelta = getX(e) - (state.left - boundingRect.left)
  }

  function removeLeftResizerListener () {
    applyCursor(classes.resize)
    setInstantState({ dragging: false })
  }

  function onLeftResizerMouseMove (e) {
    const left = ensureInOverviewBounds(getX(e) - cursorResizerDelta)
    setState({
      left: keepInBounds(left, 0, state.right - minimalPixelsBetweenResizers)
    })
  }

  function onRightResizerMouseDown (e) {
    applyCursor(classes.resize)
    setInstantState({ dragging: true })
    cursorResizerDelta = getX(e) - (state.right - boundingRect.left)
  }

  function removeRightResizerListener () {
    applyCursor(classes.resize)
    setInstantState({ dragging: false })
  }

  function onRightResizerMouseMove (e) {
    const right = ensureInOverviewBounds(getX(e) - cursorResizerDelta)
    setState({
      right: keepInBounds(right, state.left + minimalPixelsBetweenResizers, right)
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
    cursorResizerDelta = getX(e) - (state.left - boundingRect.left)
  }

  function onViewBoxElementMouseUp () {
    applyCursor(classes.grabbing)
    setInstantState({ dragging: false })
  }

  function onViewBoxElementMouseMove (e) {
    const width = state.right - state.left
    const nextLeft = getX(e) - cursorResizerDelta
    const stateLeft = keepInBounds(nextLeft, 0, options.width - width)
    setState({
      left: stateLeft,
      right: stateLeft + width,
    })
  }

  function createTooltip () {
    const tooltip = document.createElement('div')
    tooltip.className = 'tooltip'

    const tooltipDate = document.createElement('div')
    tooltipDate.style.padding = '10px 10px 0'
    tooltip.appendChild(tooltipDate)

    const tooltipLegendContainer = document.createElement('div')
    tooltipLegendContainer.className = 'tooltip__legend'
    tooltip.appendChild(tooltipLegendContainer)

    const tooltipValues = {}
    const graphInfos = {}
    options.graphNames.forEach(graphName => {
      const tooltipGraphInfo = document.createElement('div')
      tooltipGraphInfo.style.color = options.colors[graphName]
      tooltipGraphInfo.style.padding = '0 10px 10px'
      graphInfos[graphName] = tooltipGraphInfo

      const tooltipValue = document.createElement('div')
      tooltipValue.style.fontWeight = 'bold'
      tooltipGraphInfo.appendChild(tooltipValue)

      const graphNameElement = document.createElement('div')
      graphNameElement.innerText = graphName
      tooltipGraphInfo.appendChild(graphNameElement)

      tooltipValues[graphName] = tooltipValue
      tooltipLegendContainer.appendChild(tooltipGraphInfo)
    })
    return { tooltip, tooltipValues, graphInfos, tooltipDate }
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

    const tooltipContainer = document.createElement('div')
    const tooltipLine = document.createElement('div')
    tooltipLine.className = 'tooltip-line'
    tooltipContainer.appendChild(tooltipLine)

    const tooltipCircles = {}
    for (let i = 0; i < options.graphNames.length; i++) {
      const circle = document.createElement('div')
      circle.style.width = `${DOT_SIZE}px`
      circle.style.height = `${DOT_SIZE}px`
      circle.style.borderColor = options.colors[options.graphNames[i]]
      circle.className = 'tooltip__dot'
      tooltipCircles[options.graphNames[i]] = circle
      tooltipContainer.appendChild(circle)
    }

    const { tooltip, tooltipValues, graphInfos: tooltipGraphInfo, tooltipDate } = createTooltip()
    tooltipContainer.appendChild(tooltip)

    graphs.element.appendChild(tooltipContainer)

    element.appendChild(title)
    element.appendChild(graphs.element)
    element.appendChild(overview.element)
    element.appendChild(controls)

    return { graphs, element, overview, tooltip, tooltipLine, tooltipCircles, tooltipValues, tooltipGraphInfo, tooltipDate }
  }

  function createGraphs ({ width, height }) {
    const containerClassName = 'graphs'
    const element = document.createElement('div')
    element.style.width = `${width}px`
    element.style.height = `${height}px`
    element.className = containerClassName
    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
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
    viewBoxElement.style.left = `${state.left}px`
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

function getTooltipDateText (timestamp) {
  const date = new Date(timestamp)
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}