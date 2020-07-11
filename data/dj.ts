import { ChartOptions } from '../types'
// import data from './dj/1593428647696-1593429881599.json' // small
// import data from './dj/1593429959873-1593431176669.json' // small
// import data from './dj/1593431530561-1593439634946.json'
// import data from './dj/1593439844906-1593442604081.json' // small
// import data from './dj/1593442797964-1593443061303.json' // small
// import data from './dj/1593451891989-1593455062736.json' // small
// import data from './dj/1593461499573-1593461700192.json' // small
import data from './dj/1593495762538-1593515829173.json' // good good
// import data from './dj/1593520483683-1593533756968.json' // good good
// import data from './dj/1593539872402-1593541924425.json' // something is wrong
// import data from './dj/1593588503848-1593605244831.json' // good good
// import data from './dj/1593677749646-1593698839435.json' // outlier
// import data from './dj/1593703522110-1593714413899.json' good
// import data from './dj/1594016944381-1594033128194.json' good
// import data from './dj/1594040341654-1594044622200.json' good
// import data from './dj/1594049451521-1594058175214.json' good
// import data from './dj/1594102693674-1594118591304.json' good
// import data from './dj/1594118635374-1594136660259.json' good
// import data from './dj/1594195039732-1594201229091.json' good
// import data from './dj/1594285158525-1594288611161.json' good
// import data from './dj/1594288649091-1594314245729.json' // good good
// import data from './dj/1594360115922-1594368630832.json' good
// import data from './dj/1594380262422-1594391459476.json' good

export const chartOptions: ChartOptions[] = [{
  domain: data.map(d => d.timestamp),
  graphNames: ['Dow Jones 30'],
  width: 100,
  height: 100,
  lineWidth: 1,
  overviewHeight: 75,
  overviewWidth: 100,
  OVERVIEW_LINE_WIDTH: 1,
  colors: { 'Dow Jones 30': '#3DC23F' },
  data: {
    'Dow Jones 30': data.map(d => d.value),
  },
  total: data.length,
  visibilityState: {
    'Dow Jones 30': true,
  },
  viewBox: {
    startIndex: (data.length - 1) * 0.75,
    endIndex: data.length - 1,
  },
}]