import { createTransitionGroup, easing, linear, getMaxValue, getMinValue } from '../../util'
import { htmlToElement } from '../html'
import { Graph } from '../Graph'

const FRAME = 1000 / 60
const containerClassName = 'graphs'
const canvasClassName = 'graph'
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
    const element = htmlToElement(`
      <div class="${containerClassName}" style="width: ${width}px; height: ${height}px;">
        <canvas
          class="${canvasClassName}"
          width="${width * devicePixelRatio}"
          height="${height * devicePixelRatio}"
          style="width: ${width}px; height: ${height}px"
        ></canvas>
      </div>
    `)
    const canvas = element.querySelector(`.${canvasClassName}`)
    const context = canvas.getContext('2d')
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
