import { XAxis } from '../XAxis'
import { TOGGLE_VISIBILITY_STATE, VIEW_BOX_CHANGE } from '../events'
import { getMaxValue, mapDataToCoords, animate } from '../util'
import { MONTHS, DAYS, devicePixelRatio } from '../constants'
import { Tooltip, TooltipCircle, TooltipLine } from '../Tooltip'
import { Graph } from './Graph'
import { EmptyState } from '../EmptyState'
import { DRAG_START, DRAG_END } from '../../events'

const TRANSITION_DURATIONS = {
  [VIEW_BOX_CHANGE]: 150,
  ON_TOGGLE_VISIBILITY_STATE_TRANSITION: 250,
}

export function Graphs (config, {
  width,
  height,
  lineWidth,
  strokeStyles,
  viewBox: { startIndex, endIndex },
  showXAxis,
  showTooltip,
  top,
}, store) {
  store.subscribe(TOGGLE_VISIBILITY_STATE, toggleVisibility)
  if (showTooltip) {
    store.subscribe(DRAG_START, onDragStart)
    store.subscribe(DRAG_END, onDragEnd)
  }

  const element = document.createDocumentFragment()
  const canvasesContainer = document.createElement('div')
  canvasesContainer.style.width = `${width}px`
  canvasesContainer.style.height = `${height}px`
  canvasesContainer.className = 'graphs'
  if (top) canvasesContainer.style.top = `${top}px`

  const canvases = {}
  for (let i = 0; i < config.graphNames.length; i++) {
    const graph = Graph({ graphName: config.graphNames[i], width, height, lineWidth, strokeStyle: strokeStyles[config.graphNames[i]] }, store)
    canvases[config.graphNames[i]] = graph
    canvasesContainer.appendChild(graph.element)
  }
  let tooltipLine
  let tooltip
  let tooltipCircles
  if (showTooltip) {
    canvasesContainer.addEventListener('mousemove', onContainerMouseMove)
    canvasesContainer.addEventListener('mouseout', onContainerMouseOut)
    tooltipLine = TooltipLine()
    canvasesContainer.appendChild(tooltipLine.element)
    tooltip = Tooltip({
      graphNames: config.graphNames,
      colors: config.colors,
    })
    tooltipCircles = {}
    for (let i = 0; i < config.graphNames.length; i++) {
      const tooltipCircle = TooltipCircle({ color: config.colors[config.graphNames[i]] })
      canvasesContainer.appendChild(tooltipCircle.element)
      tooltipCircles[config.graphNames[i]] = tooltipCircle
    }
    canvasesContainer.appendChild(tooltip.element)
  }
  const emptyState = EmptyState(store)
  canvasesContainer.appendChild(emptyState.element)
  element.appendChild(canvasesContainer)

  let dragging = false
  let cancelAnimation
  let currentAnimationTarget
  const viewBox = {
    startIndex,
    endIndex,
  }
  let max = getMaxValue(viewBox, getArrayOfDataArrays(config.graphNames))
  let transitionDuration
  let xAxis

  if (showXAxis) {
    xAxis = XAxis({
      points: getXAxisPoints(),
      viewBox,
      width,
    })
    element.appendChild(xAxis.element)
  }

  render()

  return {
    element,
    update,
  }

  function update (event) {
    // updateViewBoxState(event)
    const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = getArrayOfDataArrays(visibleGraphNames)
    const newMax = getMaxValue(viewBox, arrayOfDataArrays)
    // Maybe add onComplete callback to cleanup cancelAnimation and currentAnimationTarget
    if (max !== newMax && newMax !== currentAnimationTarget) {
      if (cancelAnimation) cancelAnimation()
      currentAnimationTarget = newMax
      cancelAnimation = animate(max, newMax, transitionDuration, updateStateAndRender)
    } else {
      render()
    }
  }

  function updateStateAndRender (newMax) {
    max = newMax
    render()
  }

  // function setYScale (yScale) {}

  // function setViewBox (viewBox) {}

  // yScale
  function render () {
    for (let i = 0; i < config.graphNames.length; i++) {
      const graphName = config.graphNames[i]
      canvases[graphName].clear()
      canvases[graphName].renderPath(
        mapDataToCoords(config.data[graphName], max, { width: width * devicePixelRatio, height: height * devicePixelRatio }, viewBox)
      )
    }
  }

  // all data has already been precolulated
    // coords are sorted, can use binary search here
    // need input y here, not screen offset
  function onContainerMouseMove (e) {
    if (dragging) return

    const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    tooltipLine.show()

    const arrayOfDataArrays = getArrayOfDataArrays(visibleGraphNames)
    const coords = mapDataToCoords(
      config.data[visibleGraphNames[0]],
      max,
      { width: width * devicePixelRatio, height: height * devicePixelRatio },
      viewBox,
    )
    const newLeft = (e.clientX - canvasesContainer.getBoundingClientRect().x) * devicePixelRatio

    let closestPointIndex = 0
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(newLeft - coords[i].x) < Math.abs(newLeft - coords[closestPointIndex].x)) closestPointIndex = i
    }

    const values = {}
    for (let i = 0; i < visibleGraphNames.length; i++) {
      const graphName = visibleGraphNames[i]

      const thisCoords = mapDataToCoords(config.data[graphName], max, { width: width * devicePixelRatio, height: height * devicePixelRatio }, viewBox)
      tooltipCircles[graphName].show()
      // xShift can be calculated once for all points
      const x = thisCoords[closestPointIndex].x / devicePixelRatio
      const y = thisCoords[closestPointIndex].y / devicePixelRatio
      tooltipCircles[visibleGraphNames[i]].setPosition({ x, y })

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
    Object.values(tooltipCircles).forEach(dot => dot.hide())
  }

  function toggleVisibility (graphName) {
    // const hasVisibleGraphs = store.state.graphNames.filter(graphName => store.state.visibilityState[graphName]).length
    // emptyState.setVisibile(hasVisibleGraphs)
    transitionDuration = TRANSITION_DURATIONS.ON_TOGGLE_VISIBILITY_STATE_TRANSITION
    update()
  }

  function updateViewBoxState ({ type, viewBox: newViewBox }) {
    if (type === VIEW_BOX_CHANGE) {
      Object.assign(viewBox, newViewBox)
      if (xAxis) { xAxis.setViewBox(viewBox) }
      transitionDuration = TRANSITION_DURATIONS[type]
    }
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

  function onDragStart () {
    tooltip.hide()
    tooltipLine.hide()
    for (let i = 0; i < config.graphNames.length; i++) {
      tooltipCircles[config.graphNames[i]].hide()
    }
    dragging = true
  }

  function onDragEnd () {
    dragging = false
  }
}

function getLabelText (timestamp) {
  const date = new Date(timestamp)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}