import { Title } from './Title'
import { Graphs } from './Graphs'
import { Framer } from './Framer'
import { Controls } from './Controls'
import { TOGGLE_VISIBILITY_STATE, VIEW_BOX_CHANGE } from './events'
import { div } from './html'

export function Chart (chartConfig) {
  const containerElement = div()
  containerElement.appendChild(Title('Followers'))
  const { element: graphs, update: updateGraphs } = Graphs(chartConfig, {
    width: chartConfig.width,
    height: chartConfig.height,
    lineWidth: chartConfig.lineWidth,
    strokeStyles: chartConfig.colors,
    viewBox: chartConfig.renderWindow,
    showXAxis: true,
  })
  containerElement.appendChild(graphs)
  // const [overview, updateOverview] = Framer(chartConfig, onViewBoxChange)
  const updateFrameGraphs = Framer(containerElement, chartConfig, onViewBoxChange)
  containerElement.appendChild(Controls(chartConfig, onButtonClick))
  document.body.appendChild(containerElement)

  function onButtonClick (graphName) {
    chartConfig.visibilityState[graphName] = !chartConfig.visibilityState[graphName]
    updateGraphs({
      type: TOGGLE_VISIBILITY_STATE,
      graphName,
    })
    updateFrameGraphs({
      type: TOGGLE_VISIBILITY_STATE,
      graphName,
    })
  }

  function onViewBoxChange (viewBox) {
    updateGraphs({
      type: VIEW_BOX_CHANGE,
      viewBox,
    })
  }

}