// <div class="frame__container">
  // <div style="width: 1360px; height: 100px" id="frame-canvas-container-2">
    // <canvas
      // id="frame-3"
      // style="position: absolute; width: 1360px; height: 100px;"
      // width="2720"
      // height="200"
      // class="layer"
    // ></canvas>
    // <canvas
      // id="frame-4"
      // style="position: absolute; width: 1360px; height: 100px;"
      // width="2720"
      // height="200"
      // class="layer"
    // ></canvas>
  // </div>
  // <!-- <div class="frame"> -->
  // <div id="frame-bg-left-2" class="frame__background-left"></div>
  // <div id="frame-bg-right-2" class="frame__background-right"></div>
  // <div class="framer" id="framer-2">
    // <div id="resize-left-2" class="frame__resizer frame__resizer-left"></div>
    // <div id="resize-right-2" class="frame__resizer frame__resizer-right"></div>
  // </div>
  // <!-- </div> -->
// </div>

// <div style="margin-top: 20px;">
  // <label style="color: #3DC23F">
    // <input checked id="button-3" type="checkbox" class="button">
    // <div class="like-button"><div class="button-text">Joined</div></div>
  // </label>
  // <label style="color: #F34C44; margin-left: 20px;">
    // <input checked id="button-4" type="checkbox" class="button">
    // <div class="like-button"><div class="button-text">Left</div></div>
  // </label>
// </div>

function createChartConfig (
  chartData,
  inputIdentifiers,
) {
  const graphNames = chartData.columns.map(column => column[0]).filter(graphName => chartData.types[graphName] === 'line')

  const canvases = createCanvases(graphNames, {
    style: 'position: absolute; width: 1360px; height: 480px',
    width: 2720,
    height: 960,
    className: 'layer',
  })
  const canvasesContainer = createElement('div', {
    className: 'layers-container',
    style: 'width: 1360px; height: 480px; position: relative;',
  }, Object.values(canvases))
  document.body.appendChild(canvasesContainer)
  const frameCanvases = createCanvases(graphNames, {
    style: 'position: absolute; width: 1360px; height: 100px;',
    width: 2720,
    height: 200,
    className: 'layer',
  })
  const frameCanvasContainer = createElement('div', {
    style: 'width: 1360px; height: 100px',
  }, Object.values(frameCanvases))

  const backgroundLeft = createElement('div', { className: 'frame__background-left' })
  const backgroundRight = createElement('div', { className: 'frame__background-right' })

  const resizerLeft = createElement('div', { className: 'frame__resizer frame__resizer-left' })
  const resizerRight = createElement('div', { className: 'frame__resizer frame__resizer-right' })

  const framer = createElement('div', { className: 'framer' }, [resizerLeft, resizerRight])

  const frameContainer = createElement('div', { className: 'frame__container' }, [frameCanvasContainer, backgroundLeft, backgroundRight, framer])
  document.body.appendChild(frameContainer)


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
  // const inputs = graphNames.reduce((inputs, graphName, i) => ({
  //   ...inputs,
  //   [graphName]: document.querySelector(`${inputIdentifiers[i]}`)
  // }), {})
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
    // inputs,
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