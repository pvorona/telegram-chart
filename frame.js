function Framer (chartConfig, frameConfig, render) {
  const frameState = {
    left: 0,
    right: chartConfig.frameCanvasContainer.offsetWidth - chartConfig.resizerWidthPixels,
    cursorResizerDelta: 0,
    cursorFramerDelta: 0,
  }
  initFrame()

  function initFrame () {
    frameConfig.resizer.left.addEventListener('mousedown', onLeftResizerMouseDown)
    frameConfig.resizer.right.addEventListener('mousedown', onRightResizerMouseDown)
    chartConfig.framer.addEventListener('mousedown', onFramerMouseDown)
  }

  function onLeftResizerMouseDown (e) {
    e.stopPropagation()
    document.body.classList.add(frameConfig.classes.left)
    frameState.cursorResizerDelta = getX(e) - (frameConfig.resizer.left.getBoundingClientRect().left - chartConfig.frameCanvasContainer.getBoundingClientRect().left),
    document.addEventListener('mouseup', removeLeftResizerListener)
    document.addEventListener('mousemove', onLeftResizerMouseMove)
  }

  function removeLeftResizerListener () {
    document.body.classList.remove(frameConfig.classes.left)
    document.removeEventListener('mouseup', removeLeftResizerListener)
    document.removeEventListener('mousemove', onLeftResizerMouseMove)
  }

  function onLeftResizerMouseMove (e) {
    const left = ensureInFrameBounds(getX(e) - frameState.cursorResizerDelta)
    frameState.left = left > frameState.right - chartConfig.minimalPixelsBetweenResizers ? (frameState.right - chartConfig.minimalPixelsBetweenResizers) : left
    frameConfig.background.left.style.width = `${frameState.left}px`
    chartConfig.framer.style.left = `${frameState.left}px`
    const newStartIndex = Math.round(frameState.left / chartConfig.frameCanvasContainer.offsetWidth * chartConfig.data.total)
    if (newStartIndex !== chartConfig.renderWindow.startIndex) {
      chartConfig.renderWindow.startIndex = newStartIndex
      render()
    }
  }

  function onRightResizerMouseDown (e) {
    e.stopPropagation()
    document.body.classList.add(frameConfig.classes.right)
    frameState.cursorResizerDelta = getX(e) - (frameConfig.resizer.right.getBoundingClientRect().left - chartConfig.frameCanvasContainer.getBoundingClientRect().left),
    document.addEventListener('mouseup', removeRightResizerListener)
    document.addEventListener('mousemove', onRightResizerMouseMove)
  }

  function removeRightResizerListener () {
    document.body.classList.remove(frameConfig.classes.right)
    document.removeEventListener('mouseup', removeRightResizerListener)
    document.removeEventListener('mousemove', onRightResizerMouseMove)
  }

  function onRightResizerMouseMove (e) {
    const right = ensureInFrameBounds(getX(e) - frameState.cursorResizerDelta)
    frameState.right = right < frameState.left + chartConfig.minimalPixelsBetweenResizers ? (frameState.left + chartConfig.minimalPixelsBetweenResizers) : right
    frameConfig.background.right.style.left = `${frameState.right + chartConfig.resizerWidthPixels}px`
    chartConfig.framer.style.right = `${chartConfig.frameCanvasContainer.offsetWidth - (frameState.right + chartConfig.resizerWidthPixels)}px`
    const newEndIndex = Math.round(frameState.right / chartConfig.frameCanvasContainer.offsetWidth * chartConfig.data.total)
    if (newEndIndex !== chartConfig.renderWindow.endIndex) {
      chartConfig.renderWindow.endIndex = newEndIndex
      render()
    }
  }

  function getX (event) {
    const { left } = chartConfig.frameCanvasContainer.getBoundingClientRect()
    return event.clientX - left + window.scrollX - document.documentElement.scrollLeft
  }

  function ensureInFrameBounds (x) {
    if (x > chartConfig.frameCanvasContainer.offsetWidth - chartConfig.resizerWidthPixels) return chartConfig.frameCanvasContainer.offsetWidth - chartConfig.resizerWidthPixels
    if (x < 0) return 0
    return x
  }

  function onFramerMouseDown (e) {
    frameState.cursorFramerDelta = getX(e) - (chartConfig.framer.getBoundingClientRect().left - chartConfig.frameCanvasContainer.getBoundingClientRect().left),
    chartConfig.framer.classList.add(frameConfig.classes.grabbing)
    document.body.classList.add(frameConfig.classes.grabbing)
    document.addEventListener('mouseup', onFramerMouseUp)
    document.addEventListener('mousemove', onFramerMouseMove)
  }

  function onFramerMouseUp () {
    document.body.classList.remove(frameConfig.classes.grabbing)
    chartConfig.framer.classList.remove(frameConfig.classes.grabbing)
    document.removeEventListener('mouseup', onFramerMouseUp)
    document.removeEventListener('mousemove', onFramerMouseMove)
  }

  function onFramerMouseMove (e) {
    const width = frameState.right - frameState.left
    const nextLeft = getX(e) - frameState.cursorFramerDelta
    if (nextLeft < 0) {
      frameState.left = 0
    } else if (nextLeft + width > chartConfig.frameCanvasContainer.offsetWidth - chartConfig.resizerWidthPixels) {
      frameState.left = chartConfig.frameCanvasContainer.offsetWidth - width - chartConfig.resizerWidthPixels
    } else {
      frameState.left = nextLeft
    }
    frameState.right = frameState.left + width
    chartConfig.framer.style.left = `${frameState.left}px`
    chartConfig.framer.style.right = `${chartConfig.frameCanvasContainer.offsetWidth - (frameState.right + chartConfig.resizerWidthPixels)}px`
    frameConfig.background.left.style.width = `${frameState.left}px`
    frameConfig.background.right.style.left = `${frameState.right + chartConfig.resizerWidthPixels}px`
    const renderWindowSize = chartConfig.renderWindow.endIndex - chartConfig.renderWindow.startIndex
    const newStartIndex = Math.round(frameState.left / chartConfig.frameCanvasContainer.offsetWidth * chartConfig.data.total)
    if (chartConfig.renderWindow.startIndex !== newStartIndex) {
      chartConfig.renderWindow.startIndex = newStartIndex
      chartConfig.renderWindow.endIndex = newStartIndex + renderWindowSize
      render()
    }
  }
}