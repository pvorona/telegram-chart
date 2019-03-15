function Chart (chartConfig) {
  const contexts = chartConfig.graphNames.reduce((contexts, graphName) => ({
    ...contexts,
    [graphName]: chartConfig.canvases[graphName].getContext('2d')
  }), {})

  const frameContexts = chartConfig.graphNames.reduce((contexts, graphName) => ({
    ...contexts,
    [graphName]: chartConfig.frameCanvases[graphName].getContext('2d')
  }), {})

  let cancelAnimation
  let cancelFrameAnimation
  let currentAnimationTarget
  const wholeRange = {
    startIndex: 0,
    endIndex: chartConfig.data.total - 1,
  }

  Framer(chartConfig, render)
  Controls(chartConfig, render, renderFrameGraphs)

  const arrayOfDataArrays = chartConfig.graphNames.reduce(
    (reduced, graphName) => [...reduced, chartConfig.data[graphName]], []
  )
  const state = {
    max: getMaxValue(chartConfig.renderWindow, ...arrayOfDataArrays),
    frameMax: getMaxValue(wholeRange, ...arrayOfDataArrays),
  }

  render()
  renderFrameGraphs()

  function render () {
    requestAnimationFrame(renderSync)
  }

  // state = { from, to, max, visibilityState }
  // Event -> renderWindow change -> maxValueInRenderWindowChange -> render
  // currentData = data.filter(renderWindow)
  // render: state => UI

  // function setState (newState) {
    // state = newState
    // reconcile()
  // }

  const TRANSITION_TIME = 100

  function renderWithMaxSync () {
    const visibleGraphNames = chartConfig.graphNames
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, chartConfig.data[graphName]], [])
    for (const graphName of visibleGraphNames) {
      clearCanvas(contexts[graphName], chartConfig.canvases[graphName])
      renderPath(
        mapDataToCoords(chartConfig.data[graphName], state.max, chartConfig.canvases[graphName], chartConfig.renderWindow),
        contexts[graphName],
      )
    }
  }

  function renderSync () {
    const visibleGraphNames = chartConfig.graphNames.filter(graphName => chartConfig.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, chartConfig.data[graphName]], [])
    const newMax = getMaxValue(chartConfig.renderWindow, ...arrayOfDataArrays)
    // Maybe add onComplete callback to cleanup cancelAnimation and currentAnimationTarget
    if (state.max !== newMax && newMax !== currentAnimationTarget) {
      currentAnimationTarget = newMax
      if (cancelAnimation) cancelAnimation()
      cancelAnimation = animate(state.max, newMax, TRANSITION_TIME, (newMax) => {
        state.max = newMax
        renderWithMaxSync()
      })
    }
    for (const graphName of visibleGraphNames) {
      clearCanvas(contexts[graphName], chartConfig.canvases[graphName])
      renderPath(
        mapDataToCoords(chartConfig.data[graphName], state.max, chartConfig.canvases[graphName], chartConfig.renderWindow),
        contexts[graphName],
      )
    }
  }

  function renderFrameGraphs () {
    const visibleGraphNames = chartConfig.graphNames.filter(graphName => chartConfig.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, chartConfig.data[graphName]], [])
    const newMax = getMaxValue(wholeRange, ...arrayOfDataArrays)
    if (state.frameMax !== newMax) {
      if (cancelFrameAnimation) cancelFrameAnimation()
        cancelFrameAnimation = animate(state.frameMax, newMax, TRANSITION_TIME, (newMax) => {
          state.frameMax = newMax
          renderFrameWithMaxSync()
        })
    }
    for (const graphName of chartConfig.graphNames) {
      clearCanvas(frameContexts[graphName], chartConfig.frameCanvases[graphName])
      renderPath(
        mapDataToCoords(chartConfig.data[graphName], state.frameMax, chartConfig.frameCanvases[graphName], wholeRange),
        frameContexts[graphName],
      )
    }
  }

  function renderFrameWithMaxSync () {
    const visibleGraphNames = chartConfig.graphNames.filter(graphName => chartConfig.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, chartConfig.data[graphName]], [])
    for (const graphName of chartConfig.graphNames) {
      clearCanvas(frameContexts[graphName], chartConfig.frameCanvases[graphName])
      renderPath(
        mapDataToCoords(chartConfig.data[graphName], state.frameMax, chartConfig.frameCanvases[graphName], wholeRange),
        frameContexts[graphName],
      )
    }
  }
}