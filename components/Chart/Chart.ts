import { renderGraphs } from '../Graphs'
import { Controls } from '../Controls'

import { ChartOptions } from '../../types'

import { easeInOutQuart, linear } from '../../easings'
import {
  handleDrag,
  memoizeOne,
  mapDataToCoords,
  transition,
  groupTransition,
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  Transition,
  createMinArraySegmentTree,
  SegmentTree,
  interpolatePoint,
} from '../../util'
import { MONTHS } from '../constants'

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4
const minimalPixelsBetweenResizers = 10

const enum cursors {
  resize = 'ew-resize',
  grabbing = 'grabbing',
  default = '',
}

const MIN_VIEWBOX = 120

const DOT_BORDER_SIZE = 0
const DOT_SIZE = 10
const CENTER_OFFSET = - DOT_SIZE / 2 - DOT_BORDER_SIZE

const MIN_HEIGHT = 300

const WHEEL_CLEAR_TIMEOUT = 50
const WHEEL_MULTIPLIER = 3 / 16

const DEVIATION_FROM_STRAIGT_LINE_DEGREES = 45

const FRAME = 1000 / 60

const VERY_FAST_TRANSITIONS_TIME = FRAME * 4
const FAST_TRANSITIONS_TIME = FRAME * 10
const LONG_TRANSITIONS_TIME = FRAME * 26


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

export function Chart (options: ChartOptions) {
  const enabledStateByGraphName = observable(options.graphNames.reduce((state, graphName) => ({
      ...state,
      [graphName]: options.visibilityState[graphName],
    }), {} as EnabledGraphNames)
  )
  const isDragging = observable(false)
  const isWheeling = observable(false)
  const isHovering = observable(false)
  const mouseX = observable(0)
  const activeCursor = observable(cursors.default)
  const width = observable(options.width)
  const height = observable(options.height - options.overviewHeight)
  const startIndex = observable(options.viewBox.startIndex)
  const endIndex = observable(options.viewBox.endIndex)
  const left = observable(startIndex.get() / (options.total - 1) * width.get())
  const right = observable(endIndex.get() / (options.total - 1) * width.get())

  let wheelTimeoutId: number | undefined = undefined
  let cursorResizerDelta = 0

  const { element, overview, graphs, tooltip, tooltipLine, tooltipCircles, tooltipValues, tooltipGraphInfo, tooltipDate } = createDOM({
    width: width.get(),
    left: left.get(),
  })
  const boundingRect = overview.element.getBoundingClientRect()

  const minTreesByGraphName = options.graphNames.reduce((all, graphName) => ({
    ...all,
    [graphName]: createMinArraySegmentTree(options.data[graphName], (a: number, b: number) => Math.min(a, b), Infinity)
  }), {} as { [key: string]: SegmentTree<number> })

  const maxTreesByGraphName = options.graphNames.reduce((all, graphName) => ({
    ...all,
    [graphName]: createMinArraySegmentTree(options.data[graphName], (a: number, b: number) => Math.max(a, b), -Infinity)
  }), {} as { [key: string]: SegmentTree<number> })

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
      // Can place all graphs min trees in one tree
      return Math.max(...enabledGraphNames.map(
        (graphName) => maxTreesByGraphName[graphName].get(0, options.total - 1)
      ))
    }
  )

  const overallMin = computeLazy(
    [enabledGraphNames],
    function getTotalMinCompute (enabledGraphNames) {
      return Math.max(...enabledGraphNames.map(
        (graphName) => minTreesByGraphName[graphName].get(0, options.total - 1)
      ))
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
    [isDragging, isHovering, isAnyGraphEnabled, isWheeling],
    function isTooltipVisibleCompute (isDragging, isHovering, isAnyGraphEnabled, isWheeling) {
      return !isWheeling && !isDragging && isHovering && isAnyGraphEnabled
    }
  )

  const inertStartIndex = animationObservable(
    startIndex,
    transition(startIndex.get(), VERY_FAST_TRANSITIONS_TIME, linear),
  )
  const inertEndIndex = animationObservable(
    endIndex,
    transition(endIndex.get(), VERY_FAST_TRANSITIONS_TIME, linear),
  )
  const visibleMax = computeLazy(
    [startIndex, endIndex, enabledGraphNames],
    function getVisibleMaxCompute (startIndex, endIndex, enabledGraphNames) {
      performance.mark('getVisibleMaxCompute Start')

      const max = Math.max(
        ...enabledGraphNames.map(
          graphName => Math.max(
            maxTreesByGraphName[graphName].get(
              Math.ceil(startIndex),
              Math.floor(endIndex),
            ),
            interpolatePoint(startIndex, options.data[graphName]),
            interpolatePoint(endIndex, options.data[graphName]),
          )
        )
      )

      performance.mark('getVisibleMaxCompute End')

      return max
    }
  )
  const inertVisibleMax = animationObservable(
    visibleMax,
    transition(visibleMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart),
  )
  const visibleMin = computeLazy(
    [startIndex, endIndex, enabledGraphNames],
    function getVisibleMinCompute (startIndex, endIndex, enabledGraphNames) {
      performance.mark('getVisibleMinCompute Start')

      const min = Math.min(
        ...enabledGraphNames.map(
          graphName => Math.min(
            minTreesByGraphName[graphName].get(
              Math.ceil(startIndex),
              Math.floor(endIndex),
            ),
            interpolatePoint(startIndex, options.data[graphName]),
            interpolatePoint(endIndex, options.data[graphName]),
          )
        )
      )

      performance.mark('getVisibleMinCompute End')

      return min
    }
  )
  const inertVisibleMin = animationObservable(
    visibleMin,
    transition(visibleMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart),
  )
  // overview logic
  const inertOverallMax = animationObservable(
    overallMax,
    transition(overallMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart),
  )
  const inertOverallMin = animationObservable(
    overallMin,
    transition(overallMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart),
  )
  const inertOpacityStateByGraphName = animationObservable(
    opacityStateByGraphName,
    groupTransition(
      options.graphNames.reduce((state, graphName) => ({
        ...state,
        [graphName]: transition(1, LONG_TRANSITIONS_TIME, easeInOutQuart),
      }), {} as { [key: string]: Transition<number> })
    ),
  )

  const mainGraphPoints = computeLazy(
    [inertStartIndex, inertEndIndex, inertVisibleMax, inertVisibleMin, width, height],
    function mainGraphPointsCompute (startIndex, endIndex, max, min, width, height) {
      return options.graphNames.reduce((points, graphName) => ({
        ...points,
        [graphName]: mapDataToCoords(
          options.data[graphName],
          options.domain,
          max,
          min,
          { width: width * devicePixelRatio, height: height * devicePixelRatio },
          { startIndex, endIndex },
          options.lineWidth * devicePixelRatio,
          50,
        )
      }), {} as { [key: string]: Point[] })
    }
  )

  const overviewGraphPoints = computeLazy(
    [inertOverallMax, inertOverallMin, width],
    function overviewGraphPointsCompute (inertOverallMax, inertOverallMin, width) {
      return options.graphNames.reduce((points, graphName) => ({
        ...points,
        [graphName]: mapDataToCoords(
          options.data[graphName],
          options.domain,
          inertOverallMax,
          inertOverallMin,
          { width: width * devicePixelRatio, height: (options.overviewHeight - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2) * devicePixelRatio },
          { startIndex: 0, endIndex: options.total - 1 },
          options.lineWidth * devicePixelRatio,
        )
      }), {} as { [key: string]: Point[] })
    }
  )

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
      tooltip.style.display = visible ? 'block' : ''
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
    function updateTooltipPositionAndTextEffect (isTooltipVisible, points, enabledGraphNames, index, startIndex) {
      if (!isTooltipVisible) return

      const { x } = points[enabledGraphNames[0]][index]
      tooltipLine.style.transform = `translateX(${(x - 1) / devicePixelRatio}px)`
      const dataIndex = index + Math.floor(startIndex)
      for (let i = 0; i < enabledGraphNames.length; i++) {
        const { x, y } = points[enabledGraphNames[i]][index]
        tooltipCircles[enabledGraphNames[i]].style.transform = `translateX(${x / devicePixelRatio + CENTER_OFFSET}px) translateY(${y / devicePixelRatio + CENTER_OFFSET}px)`
        tooltipValues[enabledGraphNames[i]].innerText = String(options.data[enabledGraphNames[i]][dataIndex])
        // tooltipValues[enabledGraphNames[i]].innerText = getShortNumber(options.data[enabledGraphNames[i]][dataIndex])
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
      performance.measure(
        'getVisibleMaxCompute',
        'getVisibleMaxCompute Start',
        'getVisibleMaxCompute End',
      )

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
    [isDragging, isWheeling],
    (isDragging, isWheeling) => {
      if (isDragging || isWheeling) {
        inertVisibleMax.setTransition(transition(inertVisibleMax.get(), FAST_TRANSITIONS_TIME, linear))
        inertVisibleMin.setTransition(transition(inertVisibleMin.get(), FAST_TRANSITIONS_TIME, linear))
        inertOverallMax.setTransition(transition(inertOverallMax.get(), FAST_TRANSITIONS_TIME, linear))
        inertOverallMin.setTransition(transition(inertOverallMin.get(), FAST_TRANSITIONS_TIME, linear))
      } else {
        inertVisibleMax.setTransition(transition(inertVisibleMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart))
        inertVisibleMin.setTransition(transition(inertVisibleMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart))
        inertOverallMax.setTransition(transition(inertOverallMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart))
        inertOverallMin.setTransition(transition(inertOverallMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart))
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
    function onWheel (e: WheelEvent) {
      e.preventDefault()
      isWheeling.set(true)
      if (wheelTimeoutId) {
        clearTimeout(wheelTimeoutId)
      }
      wheelTimeoutId = window.setTimeout(function stopWheel () {
        isWheeling.set(false)
      }, WHEEL_CLEAR_TIMEOUT)
      // const viewBoxWidth = right.get() - left.get()

      const angle = Math.atan(e.deltaY / e.deltaX) * 180 / Math.PI


      // Noise
      if (
        (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) === 1)
        || (Math.abs(e.deltaX) === 1 && Math.abs(e.deltaY) === 0)
      ) {
        return
      }

      const viewBoxWidth = endIndex.get() - startIndex.get()
      const dynamicFactor = viewBoxWidth / MIN_VIEWBOX * WHEEL_MULTIPLIER

      if (
        (angle < -(90 - DEVIATION_FROM_STRAIGT_LINE_DEGREES) && angle >= -90) // top right, bottom left
        || (angle > (90 - DEVIATION_FROM_STRAIGT_LINE_DEGREES) && angle <= 90) // top left, bottom right
      ) {
        const deltaY = e.deltaY

        if (deltaY < 0 && ((endIndex.get() - startIndex.get() - 2 * Math.abs(deltaY * dynamicFactor)) < MIN_VIEWBOX)) {
          const center = (endIndex.get() + startIndex.get()) / 2
          startIndex.set(keepInBounds(center - MIN_VIEWBOX / 2, 0, options.total - 1 - MIN_VIEWBOX))
          endIndex.set(keepInBounds(center + MIN_VIEWBOX / 2, MIN_VIEWBOX, options.total - 1))
          left.set(startIndex.get() / (options.total - 1) * width.get())
          right.set(endIndex.get() / (options.total - 1) * width.get())

        } else {
          startIndex.set(keepInBounds(startIndex.get() - deltaY * dynamicFactor, 0, options.total - 1 - MIN_VIEWBOX))
          endIndex.set(keepInBounds(endIndex.get() + deltaY * dynamicFactor, startIndex.get() + MIN_VIEWBOX, options.total - 1))
          left.set(startIndex.get() / (options.total - 1) * width.get())
          right.set(endIndex.get() / (options.total - 1) * width.get())

        }
      } else if (
        (angle >= -DEVIATION_FROM_STRAIGT_LINE_DEGREES && angle <= DEVIATION_FROM_STRAIGT_LINE_DEGREES) // left, right
      ) {
        startIndex.set(keepInBounds(startIndex.get() + e.deltaX * dynamicFactor, 0, options.total - 1 - viewBoxWidth))
        endIndex.set(keepInBounds(startIndex.get() + viewBoxWidth, MIN_VIEWBOX, options.total - 1))
        left.set(startIndex.get() / (options.total - 1) * width.get())
        right.set(endIndex.get() / (options.total - 1) * width.get())

      } else {
        //   (angle > DEVIATION_FROM_STRAIGT_LINE_DEGREES && angle < (90 - DEVIATION_FROM_STRAIGT_LINE_DEGREES)) // top left centered, bottom right centered
        //   || (angle < -DEVIATION_FROM_STRAIGT_LINE_DEGREES && angle > -(90 - DEVIATION_FROM_STRAIGT_LINE_DEGREES)) // top right centered, bottom left centered
        // ) {
        //   if (
        //     (e.deltaX <= 0 && e.deltaY <= 0)
        //     || (e.deltaX > 0 && e.deltaY > 0)
        //   ) {
        //     left.set(keepInBounds(left.get() + e.deltaX * WHEEL_MULTIPLIER, 0, right.get() - minimalPixelsBetweenResizers))
        //   } else {
        //     right.set(keepInBounds(right.get() + e.deltaX * WHEEL_MULTIPLIER, left.get() + minimalPixelsBetweenResizers, width.get()))
        //   }
        // }
      }
    }

    graphs.element.addEventListener('wheel', onWheel)
    overview.element.addEventListener('wheel', onWheel)

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
  return `${MONTHS[date.getMonth()]} ${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}