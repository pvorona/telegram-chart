import { XAxis } from './XAxis'
import { renderPath } from './canvas-renderer'
import { TOGGLE_VISIBILITY_STATE, VIEW_BOX_CHANGE } from './events'
import { getMaxValue, clearCanvas, mapDataToCoords, animate } from './util'
import { div } from './html'
import { devicePixelRatio } from './constants'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const HIDDEN_LAYER_CLASS = 'graph__layer--hidden'
const TRANSITION_DURATIONS = {
  [VIEW_BOX_CHANGE]: 150,
  [TOGGLE_VISIBILITY_STATE]: 250,
}

export function Graphs (config, {
  width,
  height,
  lineWidth,
  strokeStyles,
  viewBox: { startIndex, endIndex },
  showXAxis,
}) {
  const fragment = document.createDocumentFragment()
  const canvasesContainer = div()
  canvasesContainer.style.width = `${width}px`
  canvasesContainer.style.height = `${height}px`

  const canvases = {}
  for (const graphName of config.graphNames) {
    const canvas = document.createElement('canvas')
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.className = 'graph__layer'
    canvases[graphName] = canvas
    canvasesContainer.appendChild(canvas)
  }

  fragment.appendChild(canvasesContainer)

  const contexts = config.graphNames.reduce((contexts, graphName) => ({
    ...contexts,
    [graphName]: canvases[graphName].getContext('2d'),
  }), {})

  config.graphNames.forEach(graphName =>
    Object.assign(contexts[graphName], {
      strokeStyle: strokeStyles[graphName],
      lineWidth: lineWidth * devicePixelRatio,
    })
  )

  let cancelAnimation
  let currentAnimationTarget
  const viewBox = {
    startIndex,
    endIndex,
  }
  let max = getMaxValue(viewBox, ...config.graphNames.reduce(
    (reduced, graphName) => [...reduced, config.data[graphName]], []
  ))
  let transitionDuration
  let xAxis
  let updateXAxis

  if (showXAxis) {
    [xAxis, updateXAxis] = XAxis({
      points: getXAxisPoints(),
      viewBox,
      width,
    })
    fragment.appendChild(xAxis)
  }

  render()

  return [fragment, update]

  function update (event) {
    updateVisibilityState(event)
    updateViewBoxState(event)
    if (showXAxis) { updateXAxis(event) }
    const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, config.data[graphName]], [])
    const newMax = getMaxValue(viewBox, ...arrayOfDataArrays)
    // Maybe add onComplete callback to cleanup cancelAnimation and currentAnimationTarget
    if (max !== newMax && newMax !== currentAnimationTarget) {
      if (cancelAnimation) cancelAnimation()
      currentAnimationTarget = newMax
      cancelAnimation = animate(max, newMax, transitionDuration, (newMax) => {
        max = newMax
        render()
      })
    } else {
      render()
    }
  }

  function render () {
    const arrayOfDataArrays = config.graphNames.reduce((reduced, graphName) => [...reduced, config.data[graphName]], [])

    for (const graphName of config.graphNames) {
      clearCanvas(contexts[graphName], canvases[graphName])
      renderPath(
        mapDataToCoords(config.data[graphName], max, { width: width * devicePixelRatio, height: height * devicePixelRatio }, viewBox),
        contexts[graphName],
      )
    }
  }

  function updateVisibilityState ({ type, graphName }) {
    if (type === TOGGLE_VISIBILITY_STATE) {
      canvases[graphName].classList.toggle(HIDDEN_LAYER_CLASS)
      transitionDuration = TRANSITION_DURATIONS[type]
    }
  }

  function updateViewBoxState ({ type, viewBox: newViewBox }) {
    if (type === VIEW_BOX_CHANGE) {
      Object.assign(viewBox, newViewBox)
      transitionDuration = TRANSITION_DURATIONS[type]
    }
  }

  function getXAxisPoints () {
    return config.domain.map((timestamp, index) => ({
      x: width / (config.domain.length - 1) * index,
      label: getLabelText(timestamp)
    }))
  }
}

function getLabelText (timestamp) {
  const date = new Date(timestamp)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}