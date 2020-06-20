import { renderGraphs } from '../Graphs'
import { Controls } from '../Controls'

import { easeInOutQuart, linear } from '../../easings'
import { computed, handleDrag, memoizeOne, getShortNumber, mapDataToCoords, memoizeObjectArgument, getMaxValue, beautifyNumber, animation, transition,
  groupTransition,
  animationObservable,
  effect,
} from '../../util'
import { MONTHS, DAYS } from '../constants'

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4
const resizerWidthPixels = 8
const minimalPixelsBetweenResizers = 40

const cursors = {
  resize: 'ew-resize',
  grabbing: 'grabbing',
  default: '',
}

const DOT_BORDER_SIZE = 2
const DOT_SIZE = 10
const CENTER_OFFSET = - DOT_SIZE / 2 - DOT_BORDER_SIZE

const FRAME = 1000 / 60

// Now:
// User Event => Set New Observable Value => Trigger Multiple Updates

// Should be:
// User Event => Set New Observable Value => Schedule Updates => Trigger One Update

// Update Order:
// Frame Start | Simple Observables => Computed Observables => Observe Effects | Frame End

export function observable (initialValue) {
  let value = initialValue
  const observers = []

  function notify () {
    observers.forEach(observer => observer(value))
  }

  return {
    set (newValue) {
      if (newValue === value) return
      value = newValue
      notify()
    },
    get () {
      return value
    },
    observe (observer) {
      observers.push(observer)

      return () => {
        for (let i = 0; i < observers.length; i++) {
          if (observers[i] === observer) {
            observers.splice(i, 1)
            return
          }
        }
      }
    },
  }
}

export function observe (
  deps,
  observer,
) {
  notify()

  const unobserves = deps.map(dep => dep.observe(notify))

  function notify () {
    return observer(...deps.map(dep => dep.get()))
  }

  return () => {
    unobserves.forEach(unobserve => unobserve())
  }
}

export function compute (
  deps,
  compute,
) {
  const obs = observable(recompute())

  const unobserves = deps.map(dep => dep.observe(onChange))

  function onChange () {
    obs.set(recompute())
  }

  function recompute () {
    return compute(...deps.map(dep => dep.get()))
  }

  return {
    ...obs,
    observe: (observer) => {
      const ownUnobserve = obs.observe(observer)

      return () => {
        ownUnobserve()
        unobserves.forEach(unobserve => unobserve())
      }
    },
  }
}

export function Chart (options) {
  const overviewState = getInitialOverviewState()

  const { element, overview, graphs, tooltip, tooltipLine, tooltipCircles, tooltipValues, tooltipGraphInfo, tooltipDate } = createDOM()
  const boundingRect = overview.element.getBoundingClientRect()

  const left = observable(overviewState.left)
  const right = observable(overviewState.right)
  const enabledGraphNamesStateObservable = observable(overviewState.enabledGraphNamesState)
  const dragging = observable(overviewState.dragging)
  const hovering = observable(overviewState.hovering)
  const mouseX = observable(overviewState.mouseX)
  const activeCursor = observable(overviewState.cursor)

  let cursorResizerDelta = 0

  const getEnabledGraphNamesObservable = compute(
    [enabledGraphNamesStateObservable],
    enabledGraphNamesState => options.graphNames.filter(graphName => enabledGraphNamesState[graphName])
  )

  const getStartIndexObservable = compute(
    [left],
    left => left / options.width * (options.data.total - 1)
  )

  const getEndIndexObservalbe = compute(
    [right],
    right => right / options.width * (options.data.total - 1)
  )

  const getTotalMaxObservable = compute(
    [getEnabledGraphNamesObservable],
    (enabledGraphNames) => getMaxValueInRange(0, options.data.total - 1, enabledGraphNames)
  )

  const getVisibilityStateSelectorObservable = compute(
    [enabledGraphNamesStateObservable],
    (enabledGraphNamesState) => options.graphNames.reduce((state, graphName) => ({
      ...state,
      [graphName]: Number(enabledGraphNamesState[graphName]),
    }), {})
  )

  const isAnyGraphEnabledObservable = compute(
    [getEnabledGraphNamesObservable],
    (enabledGraphNames) => Boolean(enabledGraphNames.length)
  )

  const isTooltipVisibleObservable = compute(
    [dragging, hovering, isAnyGraphEnabledObservable],
    (isDragging, isHovering, isAnyGraphEnabled) => !isDragging && isHovering && isAnyGraphEnabled
  )

  const inertStartIndex = animationObservable(transition(getStartIndexObservable.get(), FRAME * 4, linear))
  const inertEndIndex = animationObservable(transition(getEndIndexObservalbe.get(), FRAME * 4, linear))
  const getMaxObservable = compute(
    [getStartIndexObservable, getEndIndexObservalbe, getEnabledGraphNamesObservable],
    (startIndex, endIndex, enabledGraphNames) => getMaxValueInRange(startIndex, endIndex, enabledGraphNames)
    // (startIndex, endIndex, enabledGraphNames) => beautifyNumber(getMaxValueInRange(startIndex, endIndex, enabledGraphNames))
  )
  // const inertMax = animationObservable(transition(getMaxObservable.get(), FRAME * 6, linear))
  const inertMax = animationObservable(transition(getMaxObservable.get(), FRAME * 36, easeInOutQuart))
  const inertTotalMax = animationObservable(transition(getMaxObservable.get(), FRAME * 36, easeInOutQuart))
  const inertOpacityState = animationObservable(
    groupTransition(
      options.graphNames.reduce((state, graphName) => ({
        ...state,
        [graphName]: transition(1, FRAME * 36, easeInOutQuart),
      }), {})
    )
  )

  const getMainGraphPointsObservable = compute(
    [inertStartIndex, inertEndIndex, inertMax],
    (startIndex, endIndex, max) =>
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

  const getOverviewPointsObservable = compute(
    [inertTotalMax],
    (totalMax) =>
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
  const getTooltipIndexObservable = compute(
    [mouseX, getMainGraphPointsObservable, isTooltipVisibleObservable],
    (x, points, isTooltipVisible) => {
      if (!isTooltipVisible) return

      let closestPointIndex = 0
      for (let i = 1; i < points[options.graphNames[0]].length; i++) {
        const distance = Math.abs(points[options.graphNames[0]][i].x / devicePixelRatio - x)
        const closesDistance = Math.abs(points[options.graphNames[0]][closestPointIndex].x / devicePixelRatio - x)
        if (distance < closesDistance) closestPointIndex = i
      }
      return closestPointIndex
    }
  )


  // Can be splitted?
  const updateTooltipVisibilityObserve = effect(
    [isTooltipVisibleObservable, getEnabledGraphNamesObservable],
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

  const updateTooltipPositionObserve = effect(
    [isTooltipVisibleObservable, getMainGraphPointsObservable, getEnabledGraphNamesObservable, getTooltipIndexObservable, inertStartIndex],
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

  const updateViewBoxLeftObserve = effect(
    [left],
    left => {
      overview.viewBoxElement.style.left = `${left}px`
    }
  )

  const updateViewBoxRightObserve = effect(
    [right],
    right => overview.viewBoxElement.style.right = `${options.width - right}px`
  )

  const updateMainGraphObserve = effect(
    [inertStartIndex, inertEndIndex, inertMax, getMainGraphPointsObservable, inertOpacityState],
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

  const updateOverviewGraphObserve = effect(
    [inertOpacityState, inertTotalMax, getOverviewPointsObservable],
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

  const updateCursorObserve = effect(
    [activeCursor],
    (cursor) =>
      [document.body, overview.viewBoxElement, overview.resizerLeft, overview.resizerRight].forEach(
        element => element.style.cursor = cursor
      )
  )

  // const updateEasings = computed(
  //   [isDragging],
  //   (isDragging) => {
  //     if (isDragging) {
  //       transitions = animation(createTransitionsForDrag(), render)
  //     } else {
  //       transitions = animation(createTransitions(), render)
  //     }
  //   }
  // )

  // let transitions = animation(createTransitions(), render)

  observe(
    [getMaxObservable],
    v => {
      inertMax.set(v)
    },
  )

  observe(
    [getStartIndexObservable],
    v => {
      inertStartIndex.set(v)
    },
  )

  observe(
    [getEndIndexObservalbe],
    v => {
      inertEndIndex.set(v)
    },
  )

  observe(
    [getTotalMaxObservable],
    (v) => inertTotalMax.set(v)
  )

  observe(
    [getVisibilityStateSelectorObservable],
    (v) => inertOpacityState.set(v)
  )

  initDragListeners()

  const getGraphsBoundingRect = memoizeOne(function getGraphsBoundingRect () {
    return graphs.element.getBoundingClientRect()
  })

  return { element }

  function onButtonClick (graphName) {
    enabledGraphNamesStateObservable.set({
      ...enabledGraphNamesStateObservable.get(),
      [graphName]: !enabledGraphNamesStateObservable.get()[graphName],
    })
  }

  function getInitialOverviewState () {
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
      cursor: cursors.default,
    }
  }

  function createTransitions () {
    return groupTransition({
      startIndex: transition(getStartIndex(), FRAME * 4, linear),
      endIndex: transition(getEndIndex(), FRAME * 4, linear),
      max: transition(getMax(), FRAME * 36, easeInOutQuart),
      totalMax: transition(getTotalMax(), FRAME * 36, easeInOutQuart),
      opacityState: groupTransition(
        options.graphNames.reduce((state, graphName) => ({
          ...state,
          [graphName]: transition(1, FRAME * 36, easeInOutQuart),
        }), {})
      ),
    })
  }

  function createTransitionsForDrag () {
    return groupTransition({
      startIndex: transition(getStartIndex(), FRAME * 4, linear),
      endIndex: transition(getEndIndex(), FRAME * 4, linear),
      max: transition(getMax(), FRAME * 10, linear),
      totalMax: transition(getTotalMax(), FRAME * 10, linear),
      opacityState: groupTransition(
        options.graphNames.reduce((state, graphName) => ({
          ...state,
          [graphName]: transition(1, FRAME * 10, linear),
        }), {})
      ),
    })
  }

  function initDragListeners () {
    graphs.element.addEventListener('mouseenter', function (e) {
      const x = e.clientX - getGraphsBoundingRect().left
      hovering.set(true)
      mouseX.set(x)
      // setOverviewState({ hovering: true, mouseX: x })
    })
    graphs.element.addEventListener('mouseleave', function (e) {
      // setOverviewState({ hovering: false })
      hovering.set(false)
    })
    graphs.element.addEventListener('mousemove', function (e) {
      const x = e.clientX - getGraphsBoundingRect().left
      // setOverviewState({ mouseX: x })
      mouseX.set(x)
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

  function getMaxValueInRange (startIndex, endIndex, graphNames) {
    return getMaxValue(
      { startIndex, endIndex },
      getValues(graphNames),
    )
  }

  function getValues (graphNames) {
    return graphNames.map(graphName => options.data[graphName])
  }

  function onLeftResizerMouseDown (e) {
    dragging.set(true)
    activeCursor.set(cursors.resize)
    cursorResizerDelta = getX(e) - (left.get() - boundingRect.left)
  }

  function removeLeftResizerListener () {
    dragging.set(false)
    activeCursor.set(cursors.default)
  }

  function onLeftResizerMouseMove (e) {
    const leftVar = ensureInOverviewBounds(getX(e) - cursorResizerDelta)
    left.set(keepInBounds(leftVar, 0, right.get() - minimalPixelsBetweenResizers))
  }

  function onRightResizerMouseDown (e) {
    cursorResizerDelta = getX(e) - (right.get() - boundingRect.left)
    dragging.set(true)
    activeCursor.set(cursors.resize)
  }

  function removeRightResizerListener () {
    dragging.set(false)
    activeCursor.set(cursors.default)
  }

  function onRightResizerMouseMove (e) {
    const rightVar = ensureInOverviewBounds(getX(e) - cursorResizerDelta)
    right.set(keepInBounds(rightVar, left.get() + minimalPixelsBetweenResizers, rightVar))
  }

  function getX (event) {
    return event.clientX - boundingRect.left
  }

  function ensureInOverviewBounds (x) {
    return keepInBounds(x, 0, options.width)
  }

  function onViewBoxElementMouseDown (e) {
    cursorResizerDelta = getX(e) - (left.get() - boundingRect.left)
    dragging.set(true)
    activeCursor.set(cursors.grabbing)
  }

  function onViewBoxElementMouseUp () {
    dragging.set(false)
    activeCursor.set(cursors.default)
  }

  function onViewBoxElementMouseMove (e) {
    const width = right.get() - left.get()
    const nextLeft = getX(e) - cursorResizerDelta
    const stateLeft = keepInBounds(nextLeft, 0, options.width - width)
    left.set(stateLeft)
    right.set(stateLeft + width)
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

function keepInBounds (value, min, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}

function getTooltipDateText (timestamp) {
  const date = new Date(timestamp)
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}