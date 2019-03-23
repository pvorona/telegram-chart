import { DARK } from './components/constants'
import { ThemeSwitcher, createChartConfig, Chart } from './components'
import './css/cursors.css'

document.body.appendChild(ThemeSwitcher(DARK))

// 1/3, 1/2, 1/3, 1/3, 1/2
// Chart(createChartConfig(chartData[0]))
chartData.forEach(data => Chart(createChartConfig(data)))
