import { Title } from '../Title'
import { Graphs } from '../Graphs'
import { Overview } from '../Overview'
import { Controls } from '../Controls'
// import { XAxis } from '../xAxis'

import { easeInOutQuad, linear } from '../../easings'
import { getMaxValue, beautifyNumber, createTransitionGroup } from '../../util'
import { MONTHS } from '../constants'

const FRAME = 1000 / 60
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

export function Chart (chartConfig) {
  const state = getInitialState()
  const transitions = createTransitionGroup(state, durationsConfig, easingConfig, render)

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
    max: state.max,
  })
  // const xAxis = XAxis({
  //   points: getXAxisPoints(),
  //   viewBox: chartConfig.viewBox,
  //   width: chartConfig.width,
  // })
  const overview = Overview({
    ...chartConfig,
    height: chartConfig.OVERVIEW_CANVAS_HEIGHT,
    width: chartConfig.OVERVIEW_CANVAS_WIDTH,
    lineWidth: chartConfig.OVERVIEW_LINE_WIDTH,
    max: state.totalMax,
  }, setState, onDragStart, onDragEnd)

  element.appendChild(graphs.element)
  // element.appendChild(xAxis.element)
  element.appendChild(overview.element)
  element.appendChild(Controls(chartConfig, onButtonClick))

  return { element }

  function render (state) {
    graphs.render(state)
    // xAxis.render(state)
  }

  function setState (newState) {
    Object.assign(state, newState)
    transitions.setTargets({
      max: beautifyNumber(getMaxValueInRange(state.startIndex, state.endIndex)),
      startIndex: state.startIndex,
      endIndex: state.endIndex,
    })
  }

  function onButtonClick (graphName) {
    // chartConfig.visibilityState[graphName] = !chartConfig.visibilityState[graphName]
    setState({
      [`${graphName}_opacity`]: state[`${graphName}_opacity`] === 0 ? 1 : 0,
    })
    // overview.toggleVisibility(graphName)
  }

  function onDragStart () {
    // graphs.startDrag()
  }

  function onDragEnd () {
    // graphs.stopDrag()
  }

  function getXAxisPoints () {
    return chartConfig.domain.map((timestamp, index) => ({
      x: chartConfig.width / (chartConfig.domain.length - 1) * index,
      label: getLabelText(timestamp)
    }))
  }

  function getInitialState () {
    return {
      startIndex: chartConfig.viewBox.startIndex,
      endIndex: chartConfig.viewBox.endIndex,
      width: chartConfig.width,
      height: chartConfig.height,
      totalMax: getMaxValueInRange(0, chartConfig.data.total - 1),
      max: beautifyNumber(getMaxValueInRange(chartConfig.viewBox.startIndex, chartConfig.viewBox.endIndex)),
      ...chartConfig.graphNames.reduce((opacityState, graphName) => ({
        ...opacityState,
        [`${graphName}_opacity`]: 1,
      })),
    }
  }

  function getMaxValueInRange (startIndex, endIndex) {
    return getMaxValue(
      { startIndex, endIndex },
      getValues(chartConfig.graphNames),
    )
  }

  function getValues (graphNames) {
    return graphNames.map(graphName => chartConfig.data[graphName])
  }
}

function getLabelText (timestamp) {
  const date = new Date(timestamp)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}