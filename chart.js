function Chart (chartConfig, frameConfig) {
  // frame: chartConfig.renderWindow
  // frame: chartConfig.data.total

  // controls: config.graphNames
  // controls: config.inputs
  // controls: config.visibilityState
  // controls: config.canvases
  // controls: config.frameCanvases

  const contexts = chartConfig.graphNames.reduce((contexts, graphName) => ({
    ...contexts,
    [graphName]: chartConfig.canvases[graphName].getContext('2d')
  }), {})

  const frameContexts = chartConfig.graphNames.reduce((contexts, graphName) => ({
    ...contexts,
    [graphName]: chartConfig.frameCanvases[graphName].getContext('2d')
  }), {})

  Framer(chartConfig, frameConfig, render)
  Controls(chartConfig, render)

  render()
  renderFrameGraphs()

  function renderFrameGraphs () {
    const arrayOfDataArrays = chartConfig.graphNames.reduce((reduced, graphName) => [...reduced, chartConfig.data[graphName]], [])
    const max = getMaxValue(chartConfig.renderWindow, ...arrayOfDataArrays)
    for (const graphName of chartConfig.graphNames) {
      renderPath(
        mapDataToCoords(chartConfig.data[graphName], max, chartConfig.frameCanvases[graphName], chartConfig.renderWindow),
        chartConfig.colors[graphName],
        frameContexts[graphName],
        chartConfig.devicePixelRatio,
      )
    }
  }

  function render () {
    const visibleGraphNames = chartConfig.graphNames.filter(graphName => chartConfig.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, chartConfig.data[graphName]], [])
    const max = getMaxValue(chartConfig.renderWindow, ...arrayOfDataArrays)
    for (const graphName of visibleGraphNames) {
      clearCanvas(contexts[graphName], chartConfig.canvases[graphName])
      renderPath(
        mapDataToCoords(chartConfig.data[graphName], max, chartConfig.canvases[graphName], chartConfig.renderWindow),
        chartConfig.colors[graphName],
        contexts[graphName],
        chartConfig.devicePixelRatio,
      )
    }
  }
}