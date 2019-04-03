import { ceil, max } from '../util'
const LINE_WIDTH = 2
const OVERVIEW_LINE_WIDTH = 1
// Change here to test mobile screens
const CANVAS_WIDTH = 768 * 1
const CANVAS_HEIGHT = 300
const overviewHeight = 50
const overviewWidth = CANVAS_WIDTH

export function createChartConfig (chartData) {
  const graphNames = chartData['columns']
    .map(column => column[0])
    .filter(graphName => chartData['types'][graphName] === 'line')
  const domain = chartData['columns'].find(column => column[0] === 'x').slice(1)

  const data = chartData['columns'].reduce((data, column) => ({
    ...data,
    [column[0]]: column.slice(1),
    total: max(data.total, column.length - 1)
  }), {
    total: 0,
  })
  const visibilityState = graphNames.reduce((visibilityState, graphName) => ({
    ...visibilityState,
    [graphName]: true,
  }), {})
  const viewBox = {
    startIndex: ceil(data.total / 3 * 2),
    endIndex: data.total - 1,
  }

  return {
    title: 'Followers',
    data,
    domain,
    graphNames,
    visibilityState,
    viewBox,
    colors: chartData['colors'],
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    lineWidth: LINE_WIDTH,
    overviewWidth,
    overviewHeight,
    OVERVIEW_LINE_WIDTH,
    // get visibleGraphNames () {
    //   return this.graphNames.filter(graphName => this.visibilityState[graphName])
    // }
  }
}