function Chart (chartConfig) {
  const contexts = chartConfig.graphNames.reduce((contexts, graphName) => ({
    ...contexts,
    [graphName]: chartConfig.canvases[graphName].getContext('2d')
  }), {})

  const frameContexts = chartConfig.graphNames.reduce((contexts, graphName) => ({
    ...contexts,
    [graphName]: chartConfig.frameCanvases[graphName].getContext('2d')
  }), {})

  Framer(chartConfig, render)
  Controls(chartConfig, render, renderFrameGraphs)

  render()
  renderFrameGraphs()

  function render () {
    requestAnimationFrame(renderSync)
  }

  function renderFrameGraphs () {
    const visibleGraphNames = chartConfig.graphNames.filter(graphName => chartConfig.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, chartConfig.data[graphName]], [])
    const max = getMaxValue({ floatStartIndex: 0, startIndex: 0, floatEndIndex: chartConfig.data.total - 1, endIndex: chartConfig.data.total - 1 }, ...arrayOfDataArrays)
    for (const graphName of chartConfig.graphNames) {
      clearCanvas(frameContexts[graphName], chartConfig.frameCanvases[graphName])
      renderPath(
        mapDataToCoords(chartConfig.data[graphName], max, chartConfig.frameCanvases[graphName], { floatStartIndex: 0, startIndex: 0, floatEndIndex: chartConfig.data.total - 1, endIndex: chartConfig.data.total - 1 }),
        frameContexts[graphName],
      )
    }
  }

  function renderSync () {
    const visibleGraphNames = chartConfig.graphNames.filter(graphName => chartConfig.visibilityState[graphName])
    if (!visibleGraphNames.length) return
    const arrayOfDataArrays = visibleGraphNames.reduce((reduced, graphName) => [...reduced, chartConfig.data[graphName]], [])
    const max = getMaxValue(chartConfig.renderWindow, ...arrayOfDataArrays)
    for (const graphName of visibleGraphNames) {
      clearCanvas(contexts[graphName], chartConfig.canvases[graphName])
      renderPath(
        mapDataToCoords(chartConfig.data[graphName], max, chartConfig.canvases[graphName], chartConfig.renderWindow),
        contexts[graphName],
      )
    }
  }
}