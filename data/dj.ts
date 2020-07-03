import { ChartOptions } from '../types'
import { data } from './1593495762538-1593515829173'

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
    startIndex: 0,
    endIndex: 1000,
  },
}]