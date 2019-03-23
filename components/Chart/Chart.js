import { Title } from '../Title'
import { Graphs } from '../Graphs'
import { Framer } from '../Overview'
import { Controls } from '../Controls'
import { TOGGLE_VISIBILITY_STATE, VIEW_BOX_CHANGE } from '../events'
import { reducer } from '../../reducer'
import { div } from '../html'
import { Store } from '../../Store'

export function Chart (chartConfig) {
  const store = new Store(chartConfig, reducer)

  const containerElement = div()
  containerElement.style.marginTop = '110px'
  containerElement.appendChild(Title(chartConfig.title))
  const graphs = Graphs(chartConfig, {
    width: chartConfig.width,
    height: chartConfig.height,
    lineWidth: chartConfig.lineWidth,
    strokeStyles: chartConfig.colors,
    viewBox: chartConfig.renderWindow,
    showXAxis: true,
    showTooltip: true,
  }, store)

  containerElement.appendChild(graphs.element)
  const overview = Framer(containerElement, chartConfig, onViewBoxChange, store)
  containerElement.appendChild(Controls(chartConfig, store))
  document.body.appendChild(containerElement)

  function onViewBoxChange (viewBox) {
    graphs.update({
      type: VIEW_BOX_CHANGE,
      viewBox,
    })
  }
}