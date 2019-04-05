import { createComputedValue, beautifyNumber, getMaxValue } from '../../util'

export function createSelectors (options, state, transitions) {
  const getLeft = () => state.left
  const getRight = () => state.right
  const getEnabledGraphNamesState = () => state.enabledGraphNamesState
  const isDragging = () => state.dragging
  const isHovering = () => state.hovering

  const getEnabledGraphNames = createComputedValue(getEnabledGraphNamesState)(
    enabledGraphNamesState => options.graphNames.filter(graphName => enabledGraphNamesState[graphName])
  )
  const getStartIndex = createComputedValue(getLeft)(left => left / options.width * (options.data.total - 1))
  const getEndIndex = createComputedValue(getRight)(right => right / options.width * (options.data.total - 1))
  const getMax = createComputedValue(getStartIndex, getEndIndex, getEnabledGraphNames)(
    (startIndex, endIndex, enabledGraphNames) => beautifyNumber(getMaxValueInRange(startIndex, endIndex, enabledGraphNames))
  )
  const getTotalMax = createComputedValue(getEnabledGraphNames)(
    (enabledGraphNames) => getMaxValueInRange(0, options.data.total - 1, enabledGraphNames)
  )
  const getVisibilityStateSelector = createComputedValue(getEnabledGraphNamesState)(
    (enabledGraphNamesState) => options.graphNames.reduce((state, graphName) => ({
      ...state,
      [graphName]: Number(enabledGraphNamesState[graphName]),
    }), {})
  )
  const isAnyGraphEnabled = createComputedValue(getEnabledGraphNames)(
    (enabledGraphNames) => Boolean(enabledGraphNames.length)
  )
  const isTooltipVisible = createComputedValue(isDragging, isHovering, isAnyGraphEnabled)(
    (isDragging, isHovering) => !isDragging && isHovering && isAnyGraphEnabled
  )
  const getMouseX = function getMouseX () {
    return state.mouseX
  }


  const getInertStartIndex = () => transitions.getState().startIndex
  const getInertEndIndex = () => transitions.getState().endIndex
  const getInertMax = () => transitions.getState().max
  const getInertTotalMax = () => transitions.getState().totalMax
  const getOpacityState = () => transitions.getState().opacityState

  const getMainGraphPoints = createComputedValue(getInertStartIndex, getInertEndIndex, getInertMax)((startIndex, endIndex, max) =>
    options.graphNames.reduce((points, graphName) => ({
      ...points,
      [graphName]: mapDataToCoords(
        options.data[graphName],
        max,
        { width: options.width * devicePixelRatio, height: options.height * devicePixelRatio },
        { startIndex, endIndex },
        options.lineWidth * devicePixelRatio,
      )
    }),{})
  )
  const getOverviewPoints = createComputedValue(getInertTotalMax)((totalMax) =>
    options.graphNames.reduce((points, graphName) => ({
      ...points,
      [graphName]: mapDataToCoords(
        options.data[graphName],
        totalMax,
        { width: options.overviewWidth * devicePixelRatio, height: (options.overviewHeight - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2) * devicePixelRatio },
        { startIndex: 0, endIndex: options.data.total - 1 },
        options.lineWidth * devicePixelRatio,
      )
    }),{})
  )

  // Calculating points for hidden graphs
  const getTooltipIndex = createComputedValue(
    getMouseX,
    getMainGraphPoints,
  )((x, points) => {
    let closestPointIndex = 0
    for (let i = 1; i < points[options.graphNames[0]].length; i++) {
      const distance = Math.abs(points[options.graphNames[0]][i].x / devicePixelRatio - x)
      const closesDistance = Math.abs(points[options.graphNames[0]][closestPointIndex].x / devicePixelRatio - x)
      if (distance < closesDistance) closestPointIndex = i
    }
    return closestPointIndex
  })

  return {
    getLeft,
    getRight,
    getEnabledGraphNamesState,
    isDragging,
    isHovering,
    getEnabledGraphNames,
    getStartIndex,
    getEndIndex,
    getMax,
    getTotalMax,
    getVisibilityStateSelector,
    isAnyGraphEnabled,
    isTooltipVisible,
    getMouseX,

    getInertStartIndex,
    getInertEndIndex,
    getInertMax,
    getInertTotalMax,
    getOpacityState,
    getMainGraphPoints,
    getOverviewPoints,
    getTooltipIndex,
  }

  function getValues (graphNames) {
    return graphNames.map(graphName => options.data[graphName])
  }

  function getMaxValueInRange (startIndex, endIndex, graphNames) {
    return getMaxValue(
      { startIndex, endIndex },
      getValues(graphNames),
    )
  }
}
