import { createTransitionGroup, easing, linear, getMaxValue, getMinValue } from '../../util'
import { Graph } from '../Graph'

const FRAME = 1000 / 60
const CLASS_NAME = 'graph'
const durationsConfig = {
  startIndex: FRAME * 4,
  endIndex: FRAME * 4,
  max: FRAME * 12,
}
const easingConfig = {
  startIndex: linear,
  endIndex: linear,
  max: easing,
}

export function Graphs ({
  graphNames,
  values,
  width,
  height,
  lineWidth,
  strokeStyles,
  viewBox: { startIndex, endIndex },
  top,
}) {
  const { element, graphs, context } = createDOM()
  const state = getInitialState()
  const transitions = createTransitionGroup(state, durationsConfig, easingConfig, render)

  render(state)

  return {
    element,
    setState,
  }

  function setState (newState) {
    Object.assign(state, newState)
    transitions.setTargets({
      max: getMaxGraphValueInRange(state.startIndex, state.endIndex),
      startIndex: state.startIndex,
      endIndex: state.endIndex,
    })
  }

  function getMaxGraphValueInRange (startIndex, endIndex) {
    return getMaxValue(
      { startIndex, endIndex },
      getValues(graphNames),
    )
  }

  function render ({ startIndex, endIndex, max, width, height }) {
    context.clearRect(0, 0, width, height)
    graphs.forEach(graph =>
      graph.render({ startIndex, endIndex, max })
    )
  }

  function getValues (graphNames) {
    return graphNames.map(graphName => values[graphName])
  }

  function getInitialState () {
    return {
      startIndex,
      endIndex,
      width: width * devicePixelRatio,
      height: height * devicePixelRatio,
      max: getMaxGraphValueInRange(startIndex, endIndex),
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
    const graphs = graphNames.map(graphName =>
      Graph({
        context,
        lineWidth,
        data: values[graphName],
        strokeStyle: strokeStyles[graphName],
      })
    )
    element.appendChild(canvasesContainer)

    return { element, graphs, context }
  }
}

function setupCanvas ({ width, height }) {
  const element = document.createElement('canvas')
  element.style.width = `${width}px`
  element.style.height = `${height}px`
  element.width = width * devicePixelRatio
  element.height = height * devicePixelRatio
  element.className = CLASS_NAME

  return element.getContext('2d')
}