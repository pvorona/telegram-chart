import { Title } from './Title'
import { Graphs } from './Graphs'
import { Framer } from './Framer'
import { Controls } from './Controls'
import { EVENTS } from './constants'

export function Chart (chartConfig) {
  const containerElement = document.createElement('div')
  containerElement.appendChild(Title('Followers'))
  const updateGraphs = Graphs(containerElement, chartConfig, {
    width: chartConfig.width,
    height: chartConfig.height,
    lineWidth: chartConfig.lineWidth,
    strokeStyles: chartConfig.colors,
    viewBox: chartConfig.renderWindow,
    showXAxis: true,
  })
  // const [overview, updateOverview] = Framer(chartConfig, onViewBoxChange)
  const updateFrameGraphs = Framer(containerElement, chartConfig, onViewBoxChange)
  containerElement.appendChild(Controls(chartConfig, onButtonClick))
  document.body.appendChild(containerElement)

  function onButtonClick (graphName) {
    chartConfig.visibilityState[graphName] = !chartConfig.visibilityState[graphName]
    updateGraphs({
      type: EVENTS.TOGGLE_VISIBILITY_STATE,
      graphName,
    })
    updateFrameGraphs({
      type: EVENTS.TOGGLE_VISIBILITY_STATE,
      graphName,
    })
  }

  function onViewBoxChange (viewBox) {
    updateGraphs({
      type: EVENTS.VIEW_BOX_CHANGE,
      viewBox,
    })
  }

}