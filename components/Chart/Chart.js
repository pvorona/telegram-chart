import { Title } from '../Title'
import { Graphs } from '../Graphs'
import { Overview } from '../Overview'
import { Controls } from '../Controls'

import { easeInOutQuad, linear } from '../../easings'
import { getMaxValue, beautifyNumber, createTransitionGroup, transition } from '../../util'
import { MONTHS } from '../constants'

const FRAME = 1000 / 60
const durationsConfig = {
  startIndex: FRAME * 4,
  endIndex: FRAME * 4,
  max: FRAME * 16,
}
const easingConfig = {
  startIndex: linear,
  endIndex: linear,
  max: easeInOutQuad,
}
// AnimatableState = { startIndex, endIndex, max, ...visibilityState }
// - Durations
// - Easings
// - Multiple renders per frame
// - Overview
export function Chart (chartConfig) {
  const state = getInitialState()
  const transitions = createTransitionGroup(createTransitions(), render)

  function createTransitions () {
    return {
      startIndex: transition(state.startIndex, FRAME * 4, linear),
      endIndex: transition(state.endIndex, FRAME * 4, linear),
      max: transition(state.max, FRAME * 16, easeInOutQuad),
      ...chartConfig.graphNames.reduce((transitions, graphName) => ({
        ...transitions,
        [getVisibilityKey(graphName)]: transition(1, FRAME * 16, easeInOutQuad),
      }), {})
    }
  }

  const element = document.createElement('div')
  element.style.marginTop = '110px'
  element.appendChild(Title(chartConfig.title))
  const graphs = Graphs({
    graphNames: chartConfig.graphNames,
    values: chartConfig.data,
    width: chartConfig.width,
    height: chartConfig.height,
    lineWidth: chartConfig.lineWidth,
    strokeStyles: chartConfig.colors,
    startIndex: chartConfig.viewBox.startIndex,
    endIndex: chartConfig.viewBox.endIndex,
    ...state,
  })

  const overview = Overview({
    ...chartConfig,
    ...state,
    height: chartConfig.OVERVIEW_CANVAS_HEIGHT,
    width: chartConfig.OVERVIEW_CANVAS_WIDTH,
    lineWidth: chartConfig.OVERVIEW_LINE_WIDTH,
    max: getMaxValueInRange(0, chartConfig.data.total - 1, chartConfig.graphNames),
  }, setState)

  element.appendChild(graphs.element)
  element.appendChild(overview.element)
  element.appendChild(Controls(chartConfig, onButtonClick))

  return { element }

  function render (state) {
    graphs.render({ ...state, width: chartConfig.width, height: chartConfig.height })
  }

  function setState (newState) {
    Object.assign(state, newState)
    transitions.setTargets({
      ...state,
      max: beautifyNumber(getMaxValueInRange(state.startIndex, state.endIndex, getVisibleGraphNames())),
    })
  }

  function onButtonClick (graphName) {
    setState({
      [getVisibilityKey(graphName)]: state[getVisibilityKey(graphName)] === 0 ? 1 : 0
    })
  }

  function getInitialState () {
    return {
      startIndex: chartConfig.viewBox.startIndex,
      endIndex: chartConfig.viewBox.endIndex,
      max: beautifyNumber(getMaxValueInRange(chartConfig.viewBox.startIndex, chartConfig.viewBox.endIndex, chartConfig.graphNames)),
      ...getVisibilityState(),
    }
  }

  function getVisibilityState () {
    return chartConfig.graphNames.reduce((visibilityState, graphName) => ({
      ...visibilityState,
      [getVisibilityKey(graphName)]: 1,
    }), {})
  }

  function getMaxValueInRange (startIndex, endIndex, graphNames) {
    return getMaxValue(
      { startIndex, endIndex },
      getValues(graphNames),
    )
  }

  function getValues (graphNames) {
    return graphNames.map(graphName => chartConfig.data[graphName])
  }

  function getVisibleGraphNames () {
    return chartConfig.graphNames.filter(graphName => state[getVisibilityKey(graphName)])
  }
}

function getVisibilityKey (name) {
  return `${name}_opacity`
}