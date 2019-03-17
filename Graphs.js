const HIDDEN_LAYER_CLASS = 'graph__layer--hidden'

function Graphs (parentElement, config, {
  width,
  height,
  lineWidth,
  strokeStyles,
  viewBox: { startIndex, endIndex },
}) {
  const canvases = createCanvases(config.graphNames, {
    style: `width: ${width}px; height: ${height}px`,
    width: width * devicePixelRatio,
    height: height * devicePixelRatio,
    className: 'graph__layer',
  })
  const canvasesContainer = createElement('div', {
    style: `width: ${width}px; height: ${height}px`,
  }, Object.values(canvases))
  const contexts = config.graphNames.reduce((contexts, graphName) => ({
    ...contexts,
    [graphName]: canvases[graphName].getContext('2d'),
  }), {})
  config.graphNames.forEach(graphName =>
    Object.assign(contexts[graphName], {
      strokeStyle: strokeStyles[graphName],
      lineWidth: lineWidth * devicePixelRatio,
    })
  )

  const viewBoxChangeTransitionDuration = 150
  const visibilityStateChangeTransitionDuration = 250
  let cancelAnimation
  let currentAnimationTarget

  const arrayOfDataArrays = config.graphNames.reduce(
    (reduced, graphName) => [...reduced, config.data[graphName]], []
  )
  const viewBox = {
    startIndex,
    endIndex,
  }
  let max = getMaxValue(viewBox, ...arrayOfDataArrays)
  let transitionDuration

  render()

  parentElement.appendChild(canvasesContainer)
  const xAxisPoints = []
  for (let i = 0; i < config.data.total; i++) {
    xAxisPoints.push({
      x: width / (config.data.total - 1 - 0) * (i - 0),
    })
  }
  const [xAxis, updateXAxis] = XAxis({
    domain: config.domain,
    points: xAxisPoints,
    viewBox,
  })

  parentElement.appendChild(xAxis)

  return update

  function update (event) {
    updateVisibilityState(event)
    updateViewBoxState(event)
    updateXAxis(event)
    const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, config.data[graphName]], [])
    const newMax = getMaxValue(viewBox, ...arrayOfDataArrays)
    // Maybe add onComplete callback to cleanup cancelAnimation and currentAnimationTarget
    if (max !== newMax && newMax !== currentAnimationTarget) {
      if (cancelAnimation) cancelAnimation()
      currentAnimationTarget = newMax
      cancelAnimation = animate(max, newMax, transitionDuration, (newMax) => {
        max = newMax
        render()
      })
    } else {
      render()
    }
  }

  function render () {
    const arrayOfDataArrays = config.graphNames.reduce((reduced, graphName) => [...reduced, config.data[graphName]], [])

    for (const graphName of config.graphNames) {
      clearCanvas(contexts[graphName], canvases[graphName])
      renderPath(
        mapDataToCoords(config.data[graphName], max, { width: width * devicePixelRatio, height: height * devicePixelRatio }, viewBox),
        contexts[graphName],
      )
    }
  }

  function updateVisibilityState ({ type, graphName }) {
    if (type === EVENTS.TOGGLE_VISIBILITY_STATE) {
      canvases[graphName].classList.toggle(HIDDEN_LAYER_CLASS)
      transitionDuration = visibilityStateChangeTransitionDuration
    }
  }

  function updateViewBoxState ({ type, viewBox: newViewBox }) {
    if (type === EVENTS.VIEW_BOX_CHANGE) {
      if ('startIndex' in newViewBox) viewBox.startIndex = newViewBox.startIndex
      if ('endIndex' in newViewBox) viewBox.endIndex = newViewBox.endIndex
      transitionDuration = viewBoxChangeTransitionDuration
    }
  }
}