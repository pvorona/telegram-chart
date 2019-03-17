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
  const state = {
    max: getMaxValue(config.renderWindow, ...arrayOfDataArrays),
    startIndex,
    endIndex,
  }
  let transitionDuration

  render()

  parentElement.appendChild(canvasesContainer)

  return update

  function update (event) {
    updateVisibilityState(event)
    updateViewBoxState(event)
    const visibleGraphNames = config.graphNames.filter(graphName => config.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, config.data[graphName]], [])
    const newMax = getMaxValue(state, ...arrayOfDataArrays)
    // Maybe add onComplete callback to cleanup cancelAnimation and currentAnimationTarget
    if (state.max !== newMax && newMax !== currentAnimationTarget) {
      if (cancelAnimation) cancelAnimation()
      currentAnimationTarget = newMax
      cancelAnimation = animate(state.max, newMax, transitionDuration, (newMax) => {
        state.max = newMax
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
        mapDataToCoords(config.data[graphName], state.max, canvases[graphName], state),
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

  function updateViewBoxState ({ type, viewBox }) {
    if (type === EVENTS.VIEW_BOX_CHANGE) {
      if ('startIndex' in viewBox) state.startIndex = viewBox.startIndex
      if ('endIndex' in viewBox) state.endIndex = viewBox.endIndex
      transitionDuration = viewBoxChangeTransitionDuration
    }
  }
}