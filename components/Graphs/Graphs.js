import { XAxis } from '../XAxis'
import { YAxis } from '../YAxis'
import { TOGGLE_VISIBILITY_STATE, VIEW_BOX_CHANGE } from '../events'
import { easing, getMaxValue, getMinValue, mapDataToCoords, animateValues } from '../../util'
import { div } from '../html'
import { MONTHS, DAYS } from '../constants'
import { TooltipCircle, TooltipLine, Tooltip } from '../Tooltip'
import { Graph } from '../Graph'
import { EmptyState } from '../EmptyState'

const TRANSITION_DURATIONS = {
  [VIEW_BOX_CHANGE]: 100,
  [TOGGLE_VISIBILITY_STATE]: 200,
}

// graphNames, colors, visibilityStte, data
export function Graphs (config, {
  width,
  height,
  lineWidth,
  strokeStyles,
  viewBox: { startIndex, endIndex },
  showXAxis,
  showYAxis,
  showTooltip,
  top,
}) {
  const element = document.createDocumentFragment()
  const canvasesContainer = div()
  const viewBox = {
    startIndex,
    endIndex,
  }
  let max = getMaxValue(viewBox, getArrayOfDataArrays(config.graphNames))
  let min = getMinValue({ startIndex: 0, endIndex: config.data.total - 1 }, getArrayOfDataArrays(config.graphNames))
  let yAxis
  if (showYAxis) {
    yAxis = YAxis(max, min, height)
    canvasesContainer.appendChild(yAxis.element)
  }

  canvasesContainer.style.width = `${width}px`
  canvasesContainer.style.height = `${height}px`
  canvasesContainer.className = 'graphs'
  if (top) canvasesContainer.style.top = `${top}px`

  const canvases = {}
  for (let i = 0; i < config.graphNames.length; i++) {
    const graph = Graph({ width, height, lineWidth, strokeStyle: strokeStyles[config.graphNames[i]] })
    canvases[config.graphNames[i]] = graph
    canvasesContainer.appendChild(graph.element)
  }
  let tooltipLine
  let tooltip
  let tooltipDots
  if (showTooltip) {
    canvasesContainer.addEventListener('mousemove', onContainerMouseMove)
    canvasesContainer.addEventListener('mouseout', onContainerMouseOut)
    tooltipLine = TooltipLine()
    canvasesContainer.appendChild(tooltipLine.element)
    tooltip = Tooltip({
      graphNames: config.graphNames,
      colors: config.colors,
    })
    tooltipDots = {}
    for (let i = 0; i < config.graphNames.length; i++) {
      const tooltipCircle = TooltipCircle({ color: config.colors[config.graphNames[i]] })
      canvasesContainer.appendChild(tooltipCircle.element)
      tooltipDots[config.graphNames[i]] = tooltipCircle
    }
    canvasesContainer.appendChild(tooltip.element)
  }
  const emprtState = EmptyState()
  canvasesContainer.appendChild(emprtState.element)
  element.appendChild(canvasesContainer)

  let dragging = false
  let cancelAnimation
  let currentAnimationTarget
  let transitionDuration
  let xAxis
  let currentState = {
    startIndex,
    endIndex,
    max,
  }

  if (showXAxis) {
    xAxis = XAxis({
      points: getXAxisPoints(),
      viewBox,
      width,
    })
    element.appendChild(xAxis.element)
  }

  render(currentState)

  return {
    element,
    changeViewBox,
    toggleVisibility,
    startDrag,
    stopDrag,
  }

  function update () {
    const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = getArrayOfDataArrays(visibleGraphNames)
    const newMax = getMaxValue(viewBox, arrayOfDataArrays)
    if (cancelAnimation) cancelAnimation()
    cancelAnimation = animateValues(currentState, { ...viewBox, max: newMax }, updateStateAndRender,
      { startIndex: t => t, endIndex: t => t, max: t => t },
      { startIndex: 64, endIndex: 64, max: transitionDuration },
    )
  }

  function updateStateAndRender (state) {
    render(currentState = state)
  }

  // function setYScale (yScale) {}

  // function setViewBox (viewBox) {}

  // yScale
  function render ({ max, startIndex, endIndex }) {
    if (xAxis) xAxis.setViewBox({ startIndex, endIndex })
    if (yAxis) yAxis.setMax(max)
    for (let i = 0; i < config.graphNames.length; i++) {
      const graphName = config.graphNames[i]
      canvases[graphName].clear()
      canvases[graphName].renderPath(
        mapDataToCoords(
          config.data[graphName],
          max,
          { width: width * devicePixelRatio, height: height * devicePixelRatio },
          { startIndex, endIndex },
          lineWidth,
        )
      )
    }
  }

  // all data has already been precolulated
    // coords are sorted, can use binary search here
    // need input y here, not screen offset
  function onContainerMouseMove (e) {
    if (dragging) return

    const { max, startIndex, endIndex } = currentState
    const viewBox = { startIndex, endIndex }

    const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    tooltipLine.show()

    const arrayOfDataArrays = getArrayOfDataArrays(visibleGraphNames)
    const coords = mapDataToCoords(
      config.data[visibleGraphNames[0]],
      max,
      { width: width * devicePixelRatio, height: height * devicePixelRatio },
      viewBox,
      lineWidth,
    )
    const newLeft = (e.clientX - canvasesContainer.getBoundingClientRect().left) * devicePixelRatio

    let closestPointIndex = 0
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(newLeft - coords[i].x) < Math.abs(newLeft - coords[closestPointIndex].x)) closestPointIndex = i
    }

    const values = {}
    for (let i = 0; i < visibleGraphNames.length; i++) {
      const graphName = visibleGraphNames[i]

      const thisCoords = mapDataToCoords(
        config.data[graphName],
        max,
        { width: width * devicePixelRatio, height: height * devicePixelRatio },
        viewBox,
        lineWidth,
      )
      tooltipDots[graphName].show()
      // xShift can be calculated once for all points
      const x = thisCoords[closestPointIndex].x / devicePixelRatio
      const y = thisCoords[closestPointIndex].y / devicePixelRatio
      tooltipDots[visibleGraphNames[i]].setPosition({ x, y })

      tooltip.show()
      tooltip.setPosition(x)
      const dataIndex = closestPointIndex + Math.floor(viewBox.startIndex)
      tooltip.setDate(config.domain[dataIndex])
      values[graphName] = config.data[graphName][dataIndex]
    }
    tooltip.showValues(values)
    tooltipLine.setPosition(coords[closestPointIndex].x / devicePixelRatio)
  }

  function onContainerMouseOut () {
    tooltipLine.hide()
    tooltip.hide()
    Object.values(tooltipDots).forEach(dot => dot.hide())
  }

  function toggleVisibility (graphName) {
    canvases[graphName].toggleVisibility()
    const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName])
    emprtState.setVisibile(visibleGraphNames.length)
    transitionDuration = TRANSITION_DURATIONS[TOGGLE_VISIBILITY_STATE]
    update()
  }

  function changeViewBox (newViewBox) {
    Object.assign(viewBox, newViewBox)
    transitionDuration = TRANSITION_DURATIONS[VIEW_BOX_CHANGE]
    update()
  }

  function getXAxisPoints () {
    return config.domain.map((timestamp, index) => ({
      x: width / (config.domain.length - 1) * index,
      label: getLabelText(timestamp)
    }))
  }

  function getArrayOfDataArrays (graphNames) {
    const arrayOfDataArrays = []
    for (let i = 0; i < graphNames.length; i++) {
      arrayOfDataArrays.push(config.data[graphNames[i]])
    }
    return arrayOfDataArrays
  }

  function startDrag () {
    tooltip.hide()
    tooltipLine.hide()
    for (let i = 0; i < config.graphNames.length; i++) {
      tooltipDots[config.graphNames[i]].hide()
    }
    dragging = true
  }

  function stopDrag () {
    dragging = false
  }
}

function getLabelText (timestamp) {
  const date = new Date(timestamp)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}