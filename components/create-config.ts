import { ceil, max } from '../util'
import { ChartData, Data, ChartOptions } from '../types'
const LINE_WIDTH = 1
const OVERVIEW_LINE_WIDTH = 1
// Change here to test mobile screens
// const CANVAS_WIDTH = 776
const CANVAS_WIDTH = 1440
const CANVAS_HEIGHT = 500
const overviewHeight = 75
const overviewWidth = CANVAS_WIDTH

export function createChartConfig (chartData: ChartData): ChartOptions {
  const graphNames = chartData['columns']
    .map(column => column[0])
    .filter(graphName => chartData['types'][graphName] === 'line') as string[]
  const domain = (chartData['columns'].find(column => column[0] === 'x') as number[]).slice(1)
  const data: Data = chartData.columns.filter(c => graphNames.includes(c[0] as string)).reduce((data, column) => ({
    ...data,
    [column[0]]: column.slice(1),
  }), {})
  let total = 0
  for (const key in data) {
    total = max(total, data[key].length - 1)
  }
  const visibilityState = graphNames.reduce((visibilityState, graphName) => ({
    ...visibilityState,
    [graphName]: true,
  }), {})
  const viewBox = {
    startIndex: ceil(total / 10),
    endIndex: total - 1,
  }

  return {
    title: 'Followers',
    data,
    total,
    domain,
    graphNames,
    visibilityState,
    viewBox,
    colors: chartData.colors,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    lineWidth: LINE_WIDTH,
    overviewWidth,
    overviewHeight,
    OVERVIEW_LINE_WIDTH,
  }
}
