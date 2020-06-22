// import './polyfills'
// import { DARK } from './components/constants'
import {
  // ThemeSwitcher,
  Chart,
} from './components'
import { chartOptions } from './data/processed'

// document.body.appendChild(ThemeSwitcher(DARK))

// 1/3, 1/2, 1/3, 1/3, 1/2

// document.body.appendChild(Chart(createChartConfig(chartData[0])).element)

chartOptions
  .map(options => Chart(options))
  .forEach(chart => document.body.appendChild(chart.element))
