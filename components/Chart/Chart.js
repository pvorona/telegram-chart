import { Title } from '../Title'
import { Graphs } from '../Graphs'
import { Overview } from '../Overview'
import { Controls } from '../Controls'

export function Chart (chartConfig) {
  const element = document.createElement('div')
  element.style.marginTop = '110px'
  element.appendChild(Title(chartConfig.title))
  const graphs = Graphs(chartConfig, {
    width: chartConfig.width,
    height: chartConfig.height,
    lineWidth: chartConfig.lineWidth,
    strokeStyles: chartConfig.colors,
    viewBox: chartConfig.viewBox,
    showXAxis: true,
    showYAxis: true,
    showTooltip: true,

    // colors: chartConfig.colors,
    // graphNames: chartConfig.graphNames,
    // data: chartConfig.data,
    // domain: chartConfig.domain,
    // visibleGraphNames: get ()
    // maxVisibleValue: get ()
  })

  const overview = Overview(chartConfig, onViewBoxChange, onDragStart, onDragEnd)
  element.appendChild(graphs.element)
  element.appendChild(overview.element)
  element.appendChild(Controls(chartConfig, onButtonClick))

  return { element }

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