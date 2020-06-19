import './polyfills'
import { LIGHT, DARK } from './components/constants'
import { ThemeSwitcher, createChartConfig, Chart } from './components'

document.body.appendChild(ThemeSwitcher(DARK))

// 1/3, 1/2, 1/3, 1/3, 1/2

// document.body.appendChild(Chart(createChartConfig(chartData[0])).element)

chartData
  .map(data => Chart(createChartConfig(data)))
  .forEach(chart => document.body.appendChild(chart.element))
