function Chart (chartConfig) {
  const containerElement = document.createElement('div')
  containerElement.appendChild(Title('Followers'))
  const updateGraphs = Graphs(containerElement, chartConfig, {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    lineWidth: LINE_WIDTH,
    strokeStyles: chartConfig.colors,
    viewBox: chartConfig.renderWindow,
  })
  containerElement.appendChild(XAxis(chartConfig.domain))
  // const [overview, updateOverview] = Framer(chartConfig, onViewBoxChange)
  const updateFrameGraphs = Framer(containerElement, chartConfig, onViewBoxChange)
  containerElement.appendChild(Controls(chartConfig, onButtonClick))
  document.body.appendChild(containerElement)

  function onButtonClick (graphName) {
    chartConfig.visibilityState[graphName] = !chartConfig.visibilityState[graphName]
    updateGraphs({
      type: EVENTS.TOGGLE_VISIBILITY_STATE,
      graphName,
    })
    updateFrameGraphs({
      type: EVENTS.TOGGLE_VISIBILITY_STATE,
      graphName,
    })
  }

  function onViewBoxChange (viewBox) {
    updateGraphs({
      type: EVENTS.VIEW_BOX_CHANGE,
      viewBox,
    })
  }

}