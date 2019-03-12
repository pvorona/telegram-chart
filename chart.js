function Chart (chartConfig, frameConfig) {
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
        chartConfig.frameContexts[graphName],
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
      clearCanvas(chartConfig.contexts[graphName], chartConfig.canvases[graphName])
      renderPath(
        mapDataToCoords(chartConfig.data[graphName], max, chartConfig.canvases[graphName], chartConfig.renderWindow),
        chartConfig.colors[graphName],
        chartConfig.contexts[graphName],
        chartConfig.devicePixelRatio,
      )
    }
  }
}