// import './polyfills'
// import { DARK } from './components/constants'
import {
  // ThemeSwitcher,
  Chart,
} from './components'
import { chartOptions } from './data/dj'
// import { chartOptions } from './data/processed'

// const newData = []
// const newTime = []
// for (let i = 1; i < chartOptions[0].data['Dow Jones 30'].length; i += 2) {
//   newData.push( (chartOptions[0].data['Dow Jones 30'][i] + chartOptions[0].data['Dow Jones 30'][i - 1]) / 2 )
//   newTime.push( (chartOptions[0].domain[i] + chartOptions[0].domain[i - 1]) / 2 )
// }

// chartOptions[0].data['Dow Jones 30'] = newData
// chartOptions[0].domain = newTime;
// chartOptions[0].total = newTime.length;

// const newData2: number[] = []
// const newTime2: number[] = []
// for (let i = 1; i < newData.length; i += 2) {
//   newData2.push( (newData[i] + newData[i - 1]) / 2 )
//   newTime2.push( (newTime[i] + newTime[i - 1]) / 2 )
// }

// const newData3: number[] = []
// const newTime3: number[] = []
// for (let i = 1; i < newData2.length; i += 2) {
//   newData3.push( (newData2[i] + newData2[i - 1]) / 2 )
//   newTime3.push( (newTime2[i] + newTime2[i - 1]) / 2 )
// }

// const newData4: number[] = []
// const newTime4: number[] = []
// for (let i = 1; i < newData3.length; i += 2) {
//   newData4.push( (newData3[i] + newData3[i - 1]) / 2 )
//   newTime4.push( (newTime3[i] + newTime3[i - 1]) / 2 )
// }

// chartOptions[0].data['Dow Jones 30'] = newData4
// chartOptions[0].domain = newTime4;
// chartOptions[0].total = newTime4.length;


// document.body.appendChild(ThemeSwitcher(DARK))
(window as any).d = chartOptions
// const appContainer = document.getElementById('app')!
const chartContainer = document.getElementById('chart')!

chartContainer.appendChild(Chart({
  ...chartOptions[0],
  width: chartContainer.offsetWidth,
  height: chartContainer.offsetHeight,
}).element)
