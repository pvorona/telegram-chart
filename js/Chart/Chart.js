import { Title } from '../Title'
import { Graphs } from '../Graphs'
import { Framer } from '../Overview'
import { Controls } from '../Controls'
import { TOGGLE_VISIBILITY_STATE, VIEW_BOX_CHANGE } from '../events'
import { div } from '../html'

export function Chart (chartConfig) {
  const containerElement = div()
  containerElement.style.marginTop = '110px'
  containerElement.appendChild(Title('Followers'))
  const graphs = Graphs(chartConfig, {
    width: chartConfig.width,
    height: chartConfig.height,
    lineWidth: chartConfig.lineWidth,
    strokeStyles: chartConfig.colors,
    viewBox: chartConfig.renderWindow,
    showXAxis: true,
    showTooltip: true,
  })

  containerElement.appendChild(graphs.element)
  const overview = Framer(containerElement, chartConfig, onViewBoxChange, onDragStart, onDragEnd)
  containerElement.appendChild(Controls(chartConfig, onButtonClick))
  document.body.appendChild(containerElement)

  function onButtonClick (graphName) {
    chartConfig.visibilityState[graphName] = !chartConfig.visibilityState[graphName]
    graphs.update({
      type: TOGGLE_VISIBILITY_STATE,
      graphName,
    })
    overview.update({
      type: TOGGLE_VISIBILITY_STATE,
      graphName,
    })
  }

  function onViewBoxChange (viewBox) {
    graphs.update({
      type: VIEW_BOX_CHANGE,
      viewBox,
    })
  }

  function onDragStart () {
    graphs.startDrag()
  }

  function onDragEnd () {
    graphs.stopDrag()
  }
}