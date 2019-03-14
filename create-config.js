function createChartConfig (chartData) {
  const graphNames = chartData.columns.map(column => column[0]).filter(graphName => chartData.types[graphName] === 'line')

  const canvases = createCanvases(graphNames, {
    style: 'width: 1360px; height: 480px',
    width: 2720,
    height: 960,
    className: 'layer',
  })
  const canvasesContainer = createElement('div', {
    className: 'layers-container',
    style: 'width: 1000px; height: 480px; position: relative;',
  }, Object.values(canvases))
  const frameCanvases = createCanvases(graphNames, {
    style: 'width: 1360px; height: 50px',
    width: 2720,
    height: 100,
    className: 'layer',
  })
  const frameCanvasContainer = createElement('div', {
    style: 'width: 1360px; height: 50px',
  }, Object.values(frameCanvases))
  const backgroundLeft = createElement('div', { className: 'frame__background-left' })
  const backgroundRight = createElement('div', { className: 'frame__background-right' })
  const resizerLeft = createElement('div', { className: 'frame__resizer frame__resizer-left' })
  const resizerRight = createElement('div', { className: 'frame__resizer frame__resizer-right' })
  const framer = createElement('div', { className: 'framer' }, [resizerLeft, resizerRight])
  const frameContainer = createElement('div', { className: 'frame__container' }, [frameCanvasContainer, backgroundLeft, backgroundRight, framer])
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
  const chartContainer = createElement('div', {}, [canvasesContainer, frameContainer, buttonsContainer])
  document.body.appendChild(chartContainer)

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
    floatStartIndex: 0,
    endIndex: data.total - 1,
    floatEndIndex: data.total - 1,
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