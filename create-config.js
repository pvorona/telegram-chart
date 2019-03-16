const LINE_WIDTH = 2
const FRAME_LINE_WIDTH = 1
const CANVAS_WIDTH = 768
const CANVAS_HEIGHT = 300
const FRAME_CANVAS_HEIGHT = 50
const FRAME_CANVAS_WIDTH = CANVAS_WIDTH

function createChartConfig (chartData) {
  const graphNames = chartData.columns
    .map(column => column[0])
    .filter(graphName => chartData.types[graphName] === 'line')

  const canvases = createCanvases(graphNames, {
    style: `width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px`,
    width: CANVAS_WIDTH * devicePixelRatio,
    height: CANVAS_HEIGHT * devicePixelRatio,
    className: 'graph__layer',
  })
  const canvasesContainer = createElement('div', {
    style: `width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px`,
  }, Object.values(canvases))
  const frameCanvases = createCanvases(graphNames, {
    style: `width: ${FRAME_CANVAS_WIDTH}px; height: ${FRAME_CANVAS_HEIGHT}px`,
    width: FRAME_CANVAS_WIDTH * devicePixelRatio,
    height: FRAME_CANVAS_HEIGHT * devicePixelRatio,
    className: 'graph__layer',
  })
  const frameCanvasContainer = createElement('div', {
    style: `height: ${FRAME_CANVAS_HEIGHT}px`,
  }, Object.values(frameCanvases))
  const backgroundLeft = createElement('div', { className: 'overview__overflow overview__overflow--left' })
  const backgroundRight = createElement('div', { className: 'overview__overflow overview__overflow--right' })
  const resizerLeft = createElement('div', { className: 'overview__resizer overview__resizer--left' })
  const resizerRight = createElement('div', { className: 'overview__resizer overview__resizer--right' })
  const framer = createElement('div', { className: 'overview__viewbox' }, [resizerLeft, resizerRight])
  const frameContainer = createElement('div', { className: 'overview' }, [frameCanvasContainer, backgroundLeft, backgroundRight, framer])
  const inputs = graphNames.reduce((buttons, graphName) => ({
    ...buttons,
    [graphName]: createElement('input', { checked: true, type: 'checkbox', className: 'button' }),
  }), {})
  const buttons = graphNames.map(graphName =>
    createElement('label', { style: `color: ${chartData.colors[graphName]}` }, [
        inputs[graphName],
        createElement('div', { className: 'like-button' }, [
          createElement('div', { className: 'button-text', innerText: graphName })
        ])
      ])
  )
  const buttonsContainer = createElement('div', { style: 'margin-top: 20px'}, buttons)
  const chartContainer = createElement('div', {}, [
    Title('Followers'),
    canvasesContainer,
    frameContainer,
    buttonsContainer,
  ])
  document.body.appendChild(chartContainer)

  graphNames.forEach(graphName =>
    Object.assign(canvases[graphName].getContext('2d'), {
      strokeStyle: chartData.colors[graphName],
      lineWidth: LINE_WIDTH * devicePixelRatio,
    })
  )

  graphNames.forEach(graphName =>
    Object.assign(frameCanvases[graphName].getContext('2d'), {
      strokeStyle: chartData.colors[graphName],
      lineWidth: FRAME_LINE_WIDTH * devicePixelRatio,
    })
  )

  const data = chartData.columns.reduce((data, column) => ({
    ...data,
    [column[0]]: column.slice(1),
    total: Math.max(data.total, column.length - 1)
  }), {
    total: 0,
  })
  const visibilityState = graphNames.reduce((visibilityState, graphName) => ({
    ...visibilityState,
    [graphName]: true,
  }), {})
  const renderWindow = {
    startIndex: Math.ceil(data.total / 3 * 2),
    endIndex: data.total - 1,
  }
  const resizers = {
    left: resizerLeft,
    right: resizerRight,
  }
  const frameBackgrounds = {
    left: backgroundLeft,
    right: backgroundRight,
  }

  return {
    data,
    graphNames,
    visibilityState,
    renderWindow,
    canvases,
    frameCanvases,
    inputs,
    frameCanvasContainer,
    framer,
    resizers,
    frameBackgrounds,
    resizerWidthPixels: 8,
    minimalPixelsBetweenResizers: 40,
    classes: {
      left: 'cursor-w-resize',
      right: 'cursor-e-resize',
      grabbing: 'cursor-grabbing',
    },
  }
}