import { createSelectors } from './selectors'

import { renderGraphs } from '../Graphs'
import { Controls } from '../Controls'

import { easeInOutQuart, linear } from '../../easings'
import { createComputedValue, handleDrag, memoizeOne, getShortNumber, mapDataToCoords, memoizeObjectArgument, getMaxValue, beautifyNumber, createTransitionGroup, transition,
  simpleGroupTransition,
} from '../../util'
import { MONTHS, DAYS } from '../constants'

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


// - change easings when dragging viewbox
export function Chart (options) {
  const instantState = getInitialState()
  const { element, overview, graphs, tooltip, tooltipLine, tooltipCircles, tooltipValues, tooltipGraphInfo, tooltipDate } = createDOM()
  const boundingRect = overview.element.getBoundingClientRect()

  const {
    getLeft,
    getRight,
    getEnabledGraphNamesState,
    isDragging,
    isHovering,
    getEnabledGraphNames,
    getStartIndex,
    getEndIndex,
    getMax,
    getTotalMax,
    getVisibilityStateSelector,
    isAnyGraphEnabled,
    isTooltipVisible,
    getMouseX,
  } = createSelectors(options, instantState)

  const getInertStartIndex = () => transitions.getState().startIndex
  const getInertEndIndex = () => transitions.getState().endIndex
  const getInertMax = () => transitions.getState().max
  const getInertTotalMax = () => transitions.getState().totalMax
  const getOpacityState = () => transitions.getState().opacityState

  const getMainGraphPoints = createComputedValue(getInertStartIndex, getInertEndIndex, getInertMax)((startIndex, endIndex, max) =>
    options.graphNames.reduce((points, graphName) => ({
      ...points,
      [graphName]: mapDataToCoords(
        options.data[graphName],
        max,
        { width: options.width * devicePixelRatio, height: options.height * devicePixelRatio },
        { startIndex, endIndex },
        options.lineWidth * devicePixelRatio,
      )
    }),{})
  )
  const getOverviewPoints = createComputedValue(getInertTotalMax)((totalMax) =>
    options.graphNames.reduce((points, graphName) => ({
      ...points,
      [graphName]: mapDataToCoords(
        options.data[graphName],
        totalMax,
        { width: options.overviewWidth * devicePixelRatio, height: (options.overviewHeight - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2) * devicePixelRatio },
        { startIndex: 0, endIndex: options.data.total - 1 },
        options.lineWidth * devicePixelRatio,
      )
    }),{})
  )

  // Calculating points for hidden graphs
  const getTooltipIndex = createComputedValue(
    getMouseX,
    getMainGraphPoints,
  )((x, points) => {
    let closestPointIndex = 0
    for (let i = 1; i < points[options.graphNames[0]].length; i++) {
      const distance = Math.abs(points[options.graphNames[0]][i].x / devicePixelRatio - x)
      const closesDistance = Math.abs(points[options.graphNames[0]][closestPointIndex].x / devicePixelRatio - x)
      if (distance < closesDistance) closestPointIndex = i
    }
    return closestPointIndex
  })


  // Can be splitted?
  const updateTooltipVisibility = createComputedValue(isTooltipVisible, getEnabledGraphNames)(
    (visible, enabledGraphNames) => {
      tooltipLine.style.visibility = visible ? 'visible' : ''
      tooltip.style.visibility = visible ? 'visible' : ''
      options.graphNames.forEach(graphName =>
        tooltipCircles[graphName].style.visibility = visible && enabledGraphNames.indexOf(graphName) > -1 ? 'visible' : ''
      )
      options.graphNames.forEach(graphName =>
        tooltipGraphInfo[graphName].hidden = enabledGraphNames.indexOf(graphName) > - 1 ? false : true
      )
    }
  )
  const updateTooltipPosition = createComputedValue(
    isTooltipVisible, getMainGraphPoints, getEnabledGraphNames, getTooltipIndex, getInertStartIndex,
  )(
    (isTooltipVisible, points, enabledGraphNames, index, inertStartIndex) => {
      if (!isTooltipVisible) return

      const { x, y } = points[enabledGraphNames[0]][index]
      tooltipLine.style.transform = `translateX(${x / devicePixelRatio - 1 / 2}px)`
      const dataIndex = index + Math.floor(inertStartIndex)
      for (let i = 0; i < enabledGraphNames.length; i++) {
        const { x, y } = points[enabledGraphNames[i]][index]
        tooltipCircles[enabledGraphNames[i]].style.transform = `translateX(${x / devicePixelRatio + CENTER_OFFSET}px) translateY(${y / devicePixelRatio + CENTER_OFFSET}px)`
        tooltipValues[enabledGraphNames[i]].innerText = getShortNumber(options.data[enabledGraphNames[i]][dataIndex])
      }
      tooltipDate.innerText = getTooltipDateText(options.domain[dataIndex])
      // TODO: Force reflow
      tooltip.style.transform = `translateX(${x / devicePixelRatio - tooltip.offsetWidth / 2}px)`
    }
  )

  const updateViewBoxLeft = createComputedValue(getLeft)(left => overview.viewBoxElement.style.left = `${left}px`)
  const updateViewBoxRight = createComputedValue(getRight)(right => overview.viewBoxElement.style.right = `${options.width - right}px`)
  const updateMainGraph = createComputedValue(getInertStartIndex, getInertEndIndex, getInertMax, getMainGraphPoints, getOpacityState)(
    (startIndex, endIndex, max, points, opacityState) => renderGraphs({
      startIndex,
      endIndex,
      max,
      points,
      opacityState,
      context: graphs.context,
      width: options.width,
      height: options.height,
      values: options.data,
      graphNames: options.graphNames,
      lineWidth: options.lineWidth,
      strokeStyles: options.colors,
    })
  )
  const updateOverviewGraph = createComputedValue(getOpacityState, getTotalMax, getOverviewPoints)(
    (opacityState, totalMax, points) => renderGraphs({
      opacityState,
      points,
      max: totalMax,
      startIndex: 0,
      endIndex: options.data.total - 1,
      context: overview.graphs.context,
      width: options.overviewWidth,
      height: options.overviewHeight - 2 * VIEWBOX_TOP_BOTTOM_BORDER_WIDTH,
      graphNames: options.graphNames,
      lineWidth: options.OVERVIEW_LINE_WIDTH,
      strokeStyles: options.colors,
    })
  )

  const transitions = createTransitionGroup(createTransitions(), render)

  initDragListeners()

  const getGraphsBoundingRect = memoizeOne(function getGraphsBoundingRect () {
    return graphs.element.getBoundingClientRect()
  })

  render()

  return { element }

  function render () {
    updateViewBoxLeft()
    updateViewBoxRight()
    updateTooltipVisibility()
    updateTooltipPosition()
    updateMainGraph()
    updateOverviewGraph()
    updateTooltipPosition()
  }

  function onRawStateChanged () {
    transitions.setTarget({
      startIndex: getStartIndex(),
      endIndex: getEndIndex(),
      max: getMax(),
      totalMax: getTotalMax(),
      opacityState: getVisibilityStateSelector(),
    })
  }


  function setState (newState) {
    Object.assign(instantState, newState)
    onRawStateChanged()
    render()
  }

  function onButtonClick (graphName) {
    setState({
      enabledGraphNamesState: {
        ...instantState.enabledGraphNamesState,
        [graphName]: !instantState.enabledGraphNamesState[graphName],
      },
    })
  }

  function getInitialState () {
    return {
      left: options.viewBox.startIndex / (options.data.total - 1) * options.width,
      right: options.width,
      cursorResizerDelta: 0,
      enabledGraphNamesState: options.graphNames.reduce((state, graphName) => ({
        ...state,
        [graphName]: true,
      }), {}),
      dragging: false,
      hovering: false,
      mouseX: 0,
     }
  }

  function createTransitions () {
    return {
      startIndex: transition(getStartIndex(), FRAME * 4, linear),
      endIndex: transition(getEndIndex(), FRAME * 4, linear),
      max: transition(getMax(), FRAME * 36, easeInOutQuart),
      totalMax: transition(getTotalMax(), FRAME * 36, easeInOutQuart),
      opacityState: simpleGroupTransition(
        options.graphNames.reduce((state, graphName) => ({
          ...state,
          [graphName]: transition(1, FRAME * 36, easeInOutQuart),
        }), {})
      ),
    }
  }

  function initDragListeners () {
    graphs.element.addEventListener('mouseenter', function (e) {
      const x = e.clientX - getGraphsBoundingRect().left
      setState({ hovering: true, mouseX: x })
    })
    graphs.element.addEventListener('mouseleave', function (e) {
      setState({ hovering: false })
    })
    graphs.element.addEventListener('mousemove', function (e) {
      const x = e.clientX - getGraphsBoundingRect().left
      setState({ mouseX: x })
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

  function getVisibleGraphNames () {
    return options.graphNames.filter(graphName => instantState[getVisibilityKey(graphName)])
  }

  function applyCursor (className) {
    [document.body, overview.viewBoxElement, overview.resizerLeft, overview.resizerRight].forEach(
      element => element.classList.toggle(className)
    )
  }

  function onLeftResizerMouseDown (e) {
    applyCursor(classes.resize)
    setState({
      cursorResizerDelta: getX(e) - (instantState.left - boundingRect.left),
      dragging: true,
    })
  }

  function removeLeftResizerListener () {
    applyCursor(classes.resize)
    setState({ dragging: false })
  }

  function onLeftResizerMouseMove (e) {
    const left = ensureInOverviewBounds(getX(e) - instantState.cursorResizerDelta)
    setState({
      left: keepInBounds(left, 0, instantState.right - minimalPixelsBetweenResizers)
    })
  }

  function onRightResizerMouseDown (e) {
    applyCursor(classes.resize)
    setState({
      cursorResizerDelta: getX(e) - (instantState.right - boundingRect.left),
      dragging: true,
    })
  }

  function removeRightResizerListener () {
    applyCursor(classes.resize)
    setState({ dragging: false })
  }

  function onRightResizerMouseMove (e) {
    const right = ensureInOverviewBounds(getX(e) - instantState.cursorResizerDelta)
    setState({
      right: keepInBounds(right, instantState.left + minimalPixelsBetweenResizers, right)
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
    setState({
      cursorResizerDelta: getX(e) - (instantState.left - boundingRect.left),
      dragging: true,
    })
  }

  function onViewBoxElementMouseUp () {
    applyCursor(classes.grabbing)
    setState({ dragging: false })
  }

  function onViewBoxElementMouseMove (e) {
    const width = instantState.right - instantState.left
    const nextLeft = getX(e) - instantState.cursorResizerDelta
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