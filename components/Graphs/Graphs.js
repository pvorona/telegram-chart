import { createTransitionGroup, getMaxValue, mapDataToCoords, beautifyNumber } from '../../util'
import { easeInOutQuad, linear } from '../../easings'

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
  beautifyCelling,
}) {
  const { element, context } = createDOM()
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
    const maxValue = getMaxValue(
      { startIndex, endIndex },
      getValues(graphNames),
    )

    return beautifyCelling ? beautifyNumber(maxValue) : maxValue
  }

  function getValues (graphNames) {
    return graphNames.map(graphName => values[graphName])
  }

  function render ({ startIndex, endIndex, max, width, height }) {
    context.clearRect(0, 0, width, height)
    for (let i = 0; i < graphNames.length; i++) {
      context.strokeStyle = strokeStyles[graphNames[i]]
      context.lineWidth = lineWidth * devicePixelRatio
      const points = mapDataToCoords(
        values[graphNames[i]],
        max,
        { width, height },
        { startIndex, endIndex },
        lineWidth * devicePixelRatio,
      )
      context.beginPath()
      for (let j = 0; j < points.length; j++) {
        const { x, y } = points[j]
        context.lineTo(x, y)
      }
      context.stroke()
    }
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
    const { canvas, context } = createCanvas({ width, height })
    element.appendChild(canvas)

    return { element, context }
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