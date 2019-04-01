import { XAxis } from '../XAxis'
import { YAxis } from '../YAxis'
import { TOGGLE_VISIBILITY_STATE, VIEW_BOX_CHANGE } from '../events'
import { createTransitionGroup, values, easing, linear, getMaxValue, getMinValue, mapDataToCoords, animateValues, animate } from '../../util'
import { div } from '../html'
import { MONTHS, DAYS } from '../constants'
import { TooltipCircle, TooltipLine, Tooltip } from '../Tooltip'
import { Graph } from '../Graph'
import { EmptyState } from '../EmptyState'

const TRANSITION_DURATIONS = {
  [VIEW_BOX_CHANGE]: 200,
  [TOGGLE_VISIBILITY_STATE]: 200,
}
const FRAME = 1000 / 60
const CLASS_NAME = 'graph'

export function Graphs (config, {
  width,
  height,
  lineWidth,
  strokeStyles,
  viewBox: { startIndex, endIndex },
}) {
  const { element, graphs, context } = createDOM()
  const currentState = getInitialState()
  const transitions = createTransitionGroup(currentState, {
    startIndex: FRAME * 4,
    endIndex: FRAME * 4,
    max: FRAME * 10,
  }, {
    startIndex: linear,
    endIndex: linear,
    max: easing,
  }, render)
  render(currentState)

  return {
    element,
    setState,
  }

  function setState (state) {
    Object.assign(currentState, state)
    transitions.setTargets({
      max: getMaxGraphValue(currentState.startIndex, currentState.endIndex),
      startIndex: currentState.startIndex,
      endIndex: currentState.endIndex,
    })
  }

  function getMaxGraphValue (startIndex, endIndex) {
    return getMaxValue(
      { startIndex, endIndex },
      getDataArrays(config.graphNames),
    )
  }

  function render ({ startIndex, endIndex, max, width, height }) {
    context.clearRect(0, 0, width, height)
    graphs.forEach(graph =>
      graph.render({ startIndex, endIndex, max })
    )
  }

  function getDataArrays (graphNames) {
    return graphNames.map(graphName => config.data[graphName])
  }

  function getInitialState () {
    return {
      startIndex,
      endIndex,
      width: width * devicePixelRatio,
      height: height * devicePixelRatio,
      max: getMaxGraphValue(startIndex, endIndex),
    }
  }

  function createDOM () {
    const element = document.createDocumentFragment()
    const canvasesContainer = document.createElement('div')
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
    const graphs = config.graphNames.map(graphName =>
      graphsByName[graphName] = Graph({
        context,
        lineWidth,
        data: config.data[graphName],
        strokeStyle: strokeStyles[graphName],
      })
    )
    element.appendChild(canvasesContainer)

    return { element, graphs, context }
  }
}

function setupCanvas ({ width, height, lineWidth, strokeStyle }) {
  const element = document.createElement('canvas')
  element.style.width = `${width}px`
  element.style.height = `${height}px`
  element.width = width * devicePixelRatio
  element.height = height * devicePixelRatio
  element.className = CLASS_NAME

  return element.getContext('2d')
}