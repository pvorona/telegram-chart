function createChartConfig (
  chartData,
  canvasIdentifiers,
  frameCanvasIdentifiers,
  inputIdentifiers,
  frameCanvaseContainerIdentifier,
  framerIdentifier,
  resizerIdentifiers,
  frameBgIdentifiers,
) {
  const graphNames = chartData.columns.map(column => column[0]).filter(graphName => chartData.types[graphName] === 'line')
  const data = chartData.columns.reduce((data, column) => ({
    ...data,
    [column[0]]: column.slice(1),
    total: Math.max(data.total, column.length - 1)
  }), {
    total: 0,
  })
  const colors = chartData.colors
  const visibilityState = graphNames.reduce((visibilityState, graphName) => ({
    ...visibilityState,
    [graphName]: true,
  }), {})
  const renderWindow = {
    startIndex: 0,
    endIndex: data.total,
  }
  const canvases = graphNames.reduce((canvases, graphName, i) => ({
    ...canvases,
    [graphName]: document.querySelector(`${canvasIdentifiers[i]}`)
  }), {})
  const frameCanvases = graphNames.reduce((canvases, graphName, i) => ({
    ...canvases,
    [graphName]: document.querySelector(`${frameCanvasIdentifiers[i]}`)
  }), {})
  const inputs = graphNames.reduce((inputs, graphName, i) => ({
    ...inputs,
    [graphName]: document.querySelector(`${inputIdentifiers[i]}`)
  }), {})
  const frameCanvasContainer = document.querySelector(frameCanvaseContainerIdentifier)
  const framer = document.querySelector(framerIdentifier)
  const resizers = {
    left: document.querySelector(resizerIdentifiers[0]),
    right: document.querySelector(resizerIdentifiers[1]),
  }
  const frameBackgrounds = {
    left: document.querySelector(frameBgIdentifiers[0]),
    right: document.querySelector(frameBgIdentifiers[1]),
  }

  return {
    data,
    graphNames,
    colors,
    visibilityState,
    renderWindow,
    canvases,
    frameCanvases,
    inputs,
    frameCanvasContainer,
    framer,
    resizers,
    frameBackgrounds,
    devicePixelRatio: window.devicePixelRatio,
    resizerWidthPixels: 8,
    minimalPixelsBetweenResizers: 40,
    classes: {
      left: 'cursor-w-resize',
      right: 'cursor-e-resize',
      grabbing: 'cursor-grabbing',
    },
  }
}