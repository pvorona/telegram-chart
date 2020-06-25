import { renderGraphs } from '../Graphs'
import { Controls } from '../Controls'

import { ChartOptions } from '../../types'

import { easeInOutQuart, linear } from '../../easings'
import {
  handleDrag,
  memoizeOne,
  getShortNumber,
  mapDataToCoords,
  getMaxValue,
  transition,
  groupTransition,
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  // compute,
  Transition,
} from '../../util'
import { MONTHS, DAYS } from '../constants'

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4
// const resizerWidthPixels = 8
const minimalPixelsBetweenResizers = 40

const enum cursors {
  resize = 'ew-resize',
  grabbing = 'grabbing',
  default = '',
}

const DOT_BORDER_SIZE = 0
const DOT_SIZE = 10
const CENTER_OFFSET = - DOT_SIZE / 2 - DOT_BORDER_SIZE

const FRAME = 1000 / 60

interface EnabledGraphNames {
  [key: string]: boolean
}

interface OpacityState {
  [key: string]: number
}

interface Point {
  x: number
  y: number
}

const MIN_HEIGHT = 300

export function Chart (options: ChartOptions) {
  const enabledStateByGraphName = observable(options.graphNames.reduce((state, graphName) => ({
      ...state,
      [graphName]: true,
    }), {} as EnabledGraphNames)
  )
  const isDragging = observable(false)
  const isHovering = observable(false)
  const mouseX = observable(0)
  const activeCursor = observable(cursors.default)
  const width = observable(options.width)
  const height = observable(options.height - options.overviewHeight)
  const startIndex = observable(options.viewBox.startIndex)
  const endIndex = observable(options.viewBox.endIndex)
  const left = observable(startIndex.get() / (options.total - 1) * width.get())
  const right = observable(endIndex.get() / (options.total - 1) * width.get())

  let cursorResizerDelta = 0

  const { element, overview, graphs, tooltip, tooltipLine, tooltipCircles, tooltipValues, tooltipGraphInfo, tooltipDate } = createDOM({
    width: width.get(),
    left: left.get(),
  })
  const boundingRect = overview.element.getBoundingClientRect()

  const enabledGraphNames = computeLazy(
    [enabledStateByGraphName],
    function enabledGraphNamesCompute (enabledStateByGraphName) {
      return options.graphNames.filter(graphName => enabledStateByGraphName[graphName])
    }
  )

  window.addEventListener('resize', function resizeListener () {
    width.set(element.offsetWidth)
    height.set(Math.max(element.offsetHeight - options.overviewHeight, MIN_HEIGHT))

    // can be extracted to observe width
    // overview logic
    left.set(startIndex.get() / (options.total - 1) * width.get())
    right.set(endIndex.get() / (options.total - 1) * width.get())
  })

  // overview logic
  observe(
    [left],
    function computeStartIndex (left) {
      startIndex.set(left / width.get() * (options.total - 1))
    }
  )

  // overview logic
  observe(
    [right],
    function computeEndIndex (right) {
      endIndex.set(Math.min(right / width.get() * (options.total - 1), options.total - 1))
    }
  )

  // overview logic
  const overallMax = computeLazy(
    [enabledGraphNames],
    function getTotalMaxCompute (enabledGraphNames) {
      // can remove unnecessary abstraction
      return getMaxValueInRange(0, options.total - 1, enabledGraphNames)
    }
  )

  // why lazy
  const opacityStateByGraphName = computeLazy(
    [enabledStateByGraphName],
    function opacityStateByGraphNameCompute (enabledStateByGraphName) {
      return options.graphNames.reduce((state, graphName) => ({
        ...state,
        [graphName]: Number(enabledStateByGraphName[graphName]),
      }), {} as OpacityState)
    }
  )

  // why lazy
  const isAnyGraphEnabled = computeLazy(
    [enabledGraphNames],
    function isAnyGraphEnabledCompute (enabledGraphNames) {
      return Boolean(enabledGraphNames.length)
    }
  )

  // why lazy
  const isTooltipVisible = computeLazy(
    [isDragging, isHovering, isAnyGraphEnabled],
    function isTooltipVisibleCompute (isDragging, isHovering, isAnyGraphEnabled) {
      return !isDragging && isHovering && isAnyGraphEnabled
    }
  )

  const inertStartIndex = animationObservable(
    startIndex,
    transition(startIndex.get(), FRAME * 4, linear),
  )
  const inertEndIndex = animationObservable(
    endIndex,
    transition(endIndex.get(), FRAME * 4, linear),
  )
  const visibleMax = computeLazy(
    [startIndex, endIndex, enabledGraphNames],
    function getMaxCompute (startIndex, endIndex, enabledGraphNames) {
      return getMaxValueInRange(startIndex, endIndex, enabledGraphNames)
    }
    // (startIndex, endIndex, enabledGraphNames) => beautifyNumber(getMaxValueInRange(startIndex, endIndex, enabledGraphNames))
  )
  const inertVisibleMax = animationObservable(
    visibleMax,
    transition(visibleMax.get(), FRAME * 28, easeInOutQuart),
  )
  // overview logic
  const inertOverallMax = animationObservable(
    overallMax,
    transition(overallMax.get(), FRAME * 28, easeInOutQuart),
  )
  const inertOpacityStateByGraphName = animationObservable(
    opacityStateByGraphName,
    groupTransition(
      options.graphNames.reduce((state, graphName) => ({
        ...state,
        [graphName]: transition(1, FRAME * 28, easeInOutQuart),
      }), {} as { [key: string]: Transition<number> })
    ),
  )

  const mainGraphPoints = computeLazy(
    [inertStartIndex, inertEndIndex, inertVisibleMax, width, height],
    function mainGraphPointsCompute (startIndex, endIndex, max, width, height) {
      return options.graphNames.reduce((points, graphName) => ({
        ...points,
        [graphName]: mapDataToCoords(
          options.data[graphName],
          max,
          { width: width * devicePixelRatio, height: height * devicePixelRatio },
          { startIndex, endIndex },
          options.lineWidth * devicePixelRatio,
        )
      }), {} as { [key: string]: Point[] })
    }
  )

  const overviewGraphPoints = computeLazy(
    [inertOverallMax, width],
    function overviewGraphPointsCompute (inertOverallMax, width) {
      return options.graphNames.reduce((points, graphName) => ({
        ...points,
        [graphName]: mapDataToCoords(
          options.data[graphName],
          inertOverallMax,
          { width: width * devicePixelRatio, height: (options.overviewHeight - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2) * devicePixelRatio },
          { startIndex: 0, endIndex: options.total - 1 },
          options.lineWidth * devicePixelRatio,
        )
      }), {} as { [key: string]: Point[] })
    }
  )

  // Calculating points for hidden graphs
  // can use binary search here
  const tooltipIndex = computeLazy(
    [mouseX, mainGraphPoints, isTooltipVisible],
    function tooltipIndexCompute (x, points, isTooltipVisible) {
      if (!isTooltipVisible) return 0

      let closestPointIndex = 0
      for (let i = 1; i < points[options.graphNames[0]].length; i++) {
        const distance = Math.abs(points[options.graphNames[0]][i].x / devicePixelRatio - x)
        const closesDistance = Math.abs(points[options.graphNames[0]][closestPointIndex].x / devicePixelRatio - x)
        if (distance < closesDistance) closestPointIndex = i
      }
      return closestPointIndex
    }
  )


  effect(
    [isTooltipVisible, enabledGraphNames],
    function updateTooltipVisibilityEffect (visible, enabledGraphNames) {
      tooltipLine.style.visibility = visible ? 'visible' : ''
      tooltip.style.visibility = visible ? 'visible' : ''
      options.graphNames.forEach(graphName =>
        tooltipCircles[graphName].style.visibility = visible && enabledGraphNames.indexOf(graphName) > -1 ? 'visible' : ''
      )
      if (!visible) return
      options.graphNames.forEach(graphName =>
        tooltipGraphInfo[graphName].hidden = enabledGraphNames.indexOf(graphName) > - 1 ? false : true
      )
    }
  )

   effect(
    [isTooltipVisible, mainGraphPoints, enabledGraphNames, tooltipIndex, startIndex],
    // [isTooltipVisible, getMainGraphPointsObservable, enabledGraphNames, getTooltipIndexObservable, inertStartIndex],
    function updateTooltipPositionEffect (isTooltipVisible, points, enabledGraphNames, index, startIndex) {
      if (!isTooltipVisible) return

      const { x } = points[enabledGraphNames[0]][index]
      tooltipLine.style.transform = `translateX(${(x - 1) / 2}px)`
      const dataIndex = index + Math.floor(startIndex)
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

  effect(
    [left],
    function updateViewBoxLeftEffect (left) {
      overview.viewBoxElement.style.left = `${left}px`
    }
  )

  effect(
    [right, width],
    function updateViewBoxRightEffect (right, width) {
      overview.viewBoxElement.style.right = `${width - right}px`
    }
  )

  effect(
    [mainGraphPoints, inertOpacityStateByGraphName, width, height],
    function updateMainGraphEffect (points, opacityState, width, height) {
      graphs.canvas.width = width * window.devicePixelRatio // only needs to be run when sizes change
      graphs.canvas.height = height * window.devicePixelRatio // only needs to be run when sizes change
      renderGraphs({
        points,
        opacityState,
        width,
        height,
        context: graphs.context,
        graphNames: options.graphNames,
        lineWidth: options.lineWidth,
        strokeStyles: options.colors,
      })
    }
  )

  effect(
    [inertOpacityStateByGraphName, overviewGraphPoints, width],
    function updateOverviewGraphEffect (opacityState, points, width) {
      overview.graphs.canvas.width = width * window.devicePixelRatio // only needs to be run when sizes change
      overview.graphs.canvas.height = options.overviewHeight * window.devicePixelRatio // only needs to be run when sizes change
      renderGraphs({
        opacityState,
        points,
        width,
        context: overview.graphs.context,
        height: options.overviewHeight - 2 * VIEWBOX_TOP_BOTTOM_BORDER_WIDTH,
        graphNames: options.graphNames,
        lineWidth: options.OVERVIEW_LINE_WIDTH,
        strokeStyles: options.colors,
      })
    }
  )

  effect(
    [activeCursor],
    function updateCursorEffect (cursor) {
      [document.body, overview.viewBoxElement, overview.resizerLeft, overview.resizerRight].forEach(
        element => element.style.cursor = cursor
      )
    }
  )

  observe(
    [isDragging],
    (isDragging) => {
      if (isDragging) {
        inertVisibleMax.setTransition(transition(inertVisibleMax.get(), FRAME * 10, linear))
        inertOverallMax.setTransition(transition(inertOverallMax.get(), FRAME * 10, linear))
      } else {
        inertVisibleMax.setTransition(transition(inertVisibleMax.get(), FRAME * 28, easeInOutQuart))
        inertOverallMax.setTransition(transition(inertOverallMax.get(), FRAME * 28, easeInOutQuart))
      }
    }
  )

  const getGraphsBoundingRect = memoizeOne(function getGraphsBoundingRect () {
    return graphs.element.getBoundingClientRect()
  })

  initDragListeners()

  return { element }

  function onButtonClick (graphName: string) {
    enabledStateByGraphName.set({
      ...enabledStateByGraphName.get(),
      [graphName]: !enabledStateByGraphName.get()[graphName],
    })
  }

  function initDragListeners () {
    graphs.element.addEventListener('mouseenter', function (e) {
      isHovering.set(true)
      mouseX.set(e.clientX - getGraphsBoundingRect().left)
    })
    graphs.element.addEventListener('mouseleave', function () {
      isHovering.set(false)
    })
    graphs.element.addEventListener('mousemove', function (e) {
      mouseX.set(e.clientX - getGraphsBoundingRect().left)
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

  function getMaxValueInRange (startIndex: number, endIndex: number, graphNames: string[]) {
    return getMaxValue(
      { startIndex, endIndex },
      getValues(graphNames),
    )
  }

  function getValues (graphNames: string[]) {
    return graphNames.map(graphName => options.data[graphName])
  }

  function onLeftResizerMouseDown (e: MouseEvent) {
    isDragging.set(true)
    activeCursor.set(cursors.resize)
    cursorResizerDelta = getX(e) - (left.get() - boundingRect.left)
  }

  function removeLeftResizerListener () {
    isDragging.set(false)
    activeCursor.set(cursors.default)
  }

  function onLeftResizerMouseMove (e: MouseEvent) {
    const leftVar = ensureInOverviewBounds(getX(e) - cursorResizerDelta)
    left.set(keepInBounds(leftVar, 0, right.get() - minimalPixelsBetweenResizers))
  }

  function onRightResizerMouseDown (e: MouseEvent) {
    cursorResizerDelta = getX(e) - (right.get() - boundingRect.left)
    isDragging.set(true)
    activeCursor.set(cursors.resize)
  }

  function removeRightResizerListener () {
    isDragging.set(false)
    activeCursor.set(cursors.default)
  }

  function onRightResizerMouseMove (e: MouseEvent) {
    const rightVar = ensureInOverviewBounds(getX(e) - cursorResizerDelta)
    right.set(keepInBounds(rightVar, left.get() + minimalPixelsBetweenResizers, rightVar))
  }

  function getX (event: MouseEvent) {
    return event.clientX - boundingRect.left
  }

  function ensureInOverviewBounds (x: number) {
    return keepInBounds(x, 0, width.get())
  }

  function onViewBoxElementMouseDown (e: MouseEvent) {
    cursorResizerDelta = getX(e) - (left.get() - boundingRect.left)
    isDragging.set(true)
    activeCursor.set(cursors.grabbing)
  }

  function onViewBoxElementMouseUp () {
    isDragging.set(false)
    activeCursor.set(cursors.default)
  }

  function onViewBoxElementMouseMove (e: MouseEvent) {
    const widthVar = right.get() - left.get()
    const nextLeft = getX(e) - cursorResizerDelta
    const stateLeft = keepInBounds(nextLeft, 0, width.get() - widthVar)
    left.set(stateLeft)
    right.set(stateLeft + widthVar)
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

    const tooltipValues: { [key: string]: HTMLDivElement } = {}
    const graphInfos: { [key: string]: HTMLDivElement } = {}
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

  function createDOM ({ width, left }: { width: number, left: number }) {
    const element = document.createElement('div')
    element.style.height = '100%'
    const graphs = createGraphs({
      width: width,
      height: options.height - options.overviewHeight,
      containerHeight: `calc(100% - ${options.overviewHeight}px)`,
      containerMinHeight: MIN_HEIGHT,
    })
    const overview = createOverview({width, left})
    const controls = Controls(options, onButtonClick)

    const tooltipContainer = document.createElement('div')
    const tooltipLine = document.createElement('div')
    tooltipLine.className = 'tooltip-line'
    tooltipContainer.appendChild(tooltipLine)

    const tooltipCircles: { [key: string]: HTMLDivElement } = {}
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

    element.appendChild(graphs.element)
    element.appendChild(overview.element)
    element.appendChild(controls)

    return { graphs, element, overview, tooltip, tooltipLine, tooltipCircles, tooltipValues, tooltipGraphInfo, tooltipDate }
  }

  function createGraphs ({ width, height, containerHeight, containerMinHeight }: { width: number, height: number, containerHeight?: string, containerMinHeight?: number }) {
    const containerClassName = 'graphs'
    const element = document.createElement('div')
    element.style.height = containerHeight || `${height}px`
    if (containerMinHeight) element.style.minHeight = `${containerMinHeight}px`
    element.className = containerClassName
    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.width = `100%`
    canvas.style.height = `100%`
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    element.appendChild(canvas)

    return { element, context, canvas }
  }

  function createOverview ({ width, left }: { width: number, left: number }) {
    const containerClassName = 'overview'
    const element = document.createElement('div')
    element.className = containerClassName
    element.style.height = `${options.overviewHeight}px`
    const resizerLeft = document.createElement('div')
    resizerLeft.className = 'overview__resizer overview__resizer--left'
    const resizerRight = document.createElement('div')
    resizerRight.className = 'overview__resizer overview__resizer--right'
    const viewBoxElement = document.createElement('div')
    viewBoxElement.className ='overview__viewbox'
    viewBoxElement.style.left = `${left}px`
    viewBoxElement.appendChild(resizerLeft)
    viewBoxElement.appendChild(resizerRight)
    const graphs = createGraphs({
      width: width,
      height: options.overviewHeight,
    })
    element.appendChild(graphs.element)
    element.appendChild(viewBoxElement)
    return { element, resizerLeft, resizerRight, viewBoxElement, graphs }
  }
}

function keepInBounds (value: number, min: number, max: number) {
  if (value < min) return min
  if (value > max) return max
  return value
}

function getTooltipDateText (timestamp: number) {
  const date = new Date(timestamp)
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}