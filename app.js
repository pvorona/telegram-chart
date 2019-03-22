import { ThemeSwitcher, createChartConfig, Chart } from './js'
import './css/cursors.css'

document.body.appendChild(ThemeSwitcher(1))

// 1/3, 1/2, 1/3, 1/3, 1/2
// Chart(createChartConfig(chartData[0]))
chartData.forEach(data => Chart(createChartConfig(data)))
