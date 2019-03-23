import { Title } from '../Title'
import { Graphs } from '../Graphs'
import { Overview } from '../Overview'
import { Controls } from '../Controls'
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
    showYAxis: true,
    showTooltip: true,
  })

  containerElement.appendChild(graphs.element)
  const overview = Overview(containerElement, chartConfig, onViewBoxChange, onDragStart, onDragEnd)
  containerElement.appendChild(Controls(chartConfig, onButtonClick))
  document.body.appendChild(containerElement)

  function onButtonClick (graphName) {
    chartConfig.visibilityState[graphName] = !chartConfig.visibilityState[graphName]
    graphs.toggleVisibility(graphName)
    overview.toggleVisibility(graphName)
  }

  function onViewBoxChange (viewBox) {
    graphs.changeViewBox(viewBox)
  }

  function onDragStart () {
    graphs.startDrag()
  }

  function onDragEnd () {
    graphs.stopDrag()
  }
}