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
  [VIEW_BOX_CHANGE]: 200,
  [TOGGLE_VISIBILITY_STATE]: 250,
}
const CLASS_NAME = 'graph'

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
  const canvasesContainer = document.createElement('div')
  const viewBox = {
    startIndex,
    endIndex,
  }
  let max = getMaxValue(viewBox, getDataArrays(config.graphNames))
  let min = getMinValue({ startIndex: 0, endIndex: config.data.total - 1 }, getDataArrays(config.graphNames))
  let yAxis
  if (showYAxis) {
    yAxis = YAxis(max, min, height)
    canvasesContainer.appendChild(yAxis.element)
  }

  canvasesContainer.style.width = `${width}px`
  canvasesContainer.style.height = `${height}px`
  canvasesContainer.className = 'graphs'
  if (top) canvasesContainer.style.top = `${top}px`

  const context = setupCanvas({
    width,
    height,
  })
  canvasesContainer.appendChild(context.canvas)
  const graphsByName = {}
  const thisGraphs = config.graphNames.map(graphName =>
    graphsByName[graphName] = Graph({
      context,
      lineWidth,
      data: config.data[graphName],
      strokeStyle: strokeStyles[graphName],
    })
  )

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

  function update (viewBox) {
    if (cancelAnimation) cancelAnimation()
    const data = getDataArrays(config.visibleGraphNames)
    const max = getMaxValue(viewBox, data)
    cancelAnimation = animateValues(currentState, { ...viewBox, max }, updateStateAndRender,
      { startIndex: t => t, endIndex: t => t, max: t => t },
      { startIndex: 64, endIndex: 64, max: 64 },
    )
  }

  function updateStateAndRender (state) {
    render(currentState = state)
  }

  // function updateStateAndRender (newMax) {
  //   max = newMax
  //   if (yAxis) yAxis.setMax(newMax)
  //   render()
  // }

  function render ({ startIndex, endIndex, max }) {
    // const { visibleGraphNames } = config
    // if (!visibleGraphNames.length) return
    // const data = getDataArrays(config.visibleGraphNames)
    // const max = getMaxValue(viewBox, data)

    if (yAxis) yAxis.setMax(max)
    if (xAxis) xAxis.setViewBox({ startIndex, endIndex })

    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    thisGraphs.forEach(graph =>
      graph.render({ viewBox: { startIndex, endIndex }, max })
    )
  }

  function toggleVisibility (graphName) {
    graphsByName[graphName].toggleVisibility()
    const { visibleGraphNames } = config
    emprtState.setVisibile(visibleGraphNames.length)
    update(viewBox)
  }

  // function getDiffViewBox (a, b) {}

  function changeViewBox (newViewBox) {
    // const max = Math.max(max, getMaxValue(
    //   getDiffViewBox(viewBox, newViewBox),
    //   getDataArrays(config.visibleGraphNames))
    // )
    Object.assign(viewBox, newViewBox)
    update(viewBox)
  }

  function getXAxisPoints () {
    return config.domain.map((timestamp, index) => ({
      x: width / (config.domain.length - 1) * index,
      label: getLabelText(timestamp)
    }))
  }

  function getDataArrays (graphNames) {
    return graphNames.map(graphName => config.data[graphName])
  }

  function startDrag () {
    if (showTooltip) {
      tooltip.hide()
      tooltipLine.hide()
      for (let i = 0; i < config.graphNames.length; i++) {
        tooltipDots[config.graphNames[i]].hide()
      }
    }
    dragging = true
  }

  function stopDrag () {
    dragging = false
  }

  // all data has already been precolulated
    // coords are sorted, can use binary search here
    // need input y here, not screen offset
  function onContainerMouseMove (e) {
    if (dragging) return

    const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    tooltipLine.show()

    const dataArrays = getDataArrays(visibleGraphNames)
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
}

function getLabelText (timestamp) {
  const date = new Date(timestamp)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

function setupCanvas ({ width, height, lineWidth, strokeStyle }) {
  const element = document.createElement('canvas')
  element.style.width = `${width}px`
  element.style.height = `${height}px`
  element.width = width * devicePixelRatio
  element.height = height * devicePixelRatio
  element.className = CLASS_NAME

  const context = element.getContext('2d')
  // context.strokeStyle = strokeStyle
  // context.lineWidth = lineWidth * devicePixelRatio

  return context
}