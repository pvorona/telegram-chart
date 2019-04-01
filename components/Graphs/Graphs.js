import { createTransitionGroup, easeInOutQuad, linear, getMaxValue } from '../../util'
import { Graph } from '../Graph'

const FRAME = 1000 / 60
const containerClassName = 'graphs'
const durationsConfig = {
  startIndex: FRAME * 4,
  endIndex: FRAME * 4,
  max: FRAME * 12,
}
const easingConfig = {
  startIndex: linear,
  endIndex: linear,
  max: easeInOutQuad,
}

export function Graphs ({
  graphNames,
  values,
  width,
  height,
  lineWidth,
  strokeStyles,
  startIndex,
  endIndex,
  top,
}) {
  const { element, context } = createDOM()
  const graphs = createGraphs(context)
  const state = getInitialState()
  const transitions = createTransitionGroup(state, durationsConfig, easingConfig, render)

  render(state)

  return { element, setState }

  function setState (newState) {
    Object.assign(state, newState)
    transitions.setTargets({
      max: getMaxValueInRange(state.startIndex, state.endIndex),
      startIndex: state.startIndex,
      endIndex: state.endIndex,
    })
  }

  function getMaxValueInRange (startIndex, endIndex) {
    return getMaxValue(
      { startIndex, endIndex },
      getValues(graphNames),
    )
  }

  function getValues (graphNames) {
    return graphNames.map(graphName => values[graphName])
  }

  function render ({ startIndex, endIndex, max, width, height }) {
    context.clearRect(0, 0, width, height)
    graphs.forEach(graph => graph.render({ startIndex, endIndex, max }))
  }

  function getInitialState () {
    return {
      startIndex,
      endIndex,
      width: width * devicePixelRatio,
      height: height * devicePixelRatio,
      max: getMaxValueInRange(startIndex, endIndex),
    }
  }

  function createDOM () {
    const element = document.createElement('div')
    element.style.width = `${width}px`
    element.style.height = `${height}px`
    element.className = containerClassName
    if (top) element.style.top = `${top}px`
    const { canvas, context } = createCanvas({ width, height })
    element.appendChild(canvas)

    return { element, context }
  }

  function createGraphs (context) {
    return graphNames.map(graphName =>
      Graph({
        context,
        lineWidth,
        width: width * devicePixelRatio,
        height: height * devicePixelRatio,
        values: values[graphName],
        strokeStyle: strokeStyles[graphName],
      })
    )
  }
}

function createCanvas ({ width, height }) {
  const canvas = document.createElement('canvas')
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.width = width * devicePixelRatio
  canvas.height = height * devicePixelRatio

  const context = canvas.getContext('2d')
  return { context, canvas }
}