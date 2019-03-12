function Controls (config, render) {
  for (const graphName of config.graphNames) {
    config.inputs[graphName].addEventListener('click', onButtonClick.bind(undefined, graphName))
  }

  function onButtonClick (graphName) {
    config.visibilityState[graphName] = !config.visibilityState[graphName]
    config.canvases[graphName].classList.toggle('hidden')
    config.frameCanvases[graphName].classList.toggle('hidden')
    render()
  }
}