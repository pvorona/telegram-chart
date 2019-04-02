import './polyfills'
import { LIGHT } from './components/constants'
import { ThemeSwitcher, createChartConfig, Chart } from './components'
import './css/cursors.css'

document.body.appendChild(ThemeSwitcher(LIGHT))

// 1/3, 1/2, 1/3, 1/3, 1/2
// Chart(createChartConfig(chartData[0]))
chartData.slice(0, 1)
  .map(data => Chart(createChartConfig(data)))
  .forEach(chart => document.body.appendChild(chart.element))
