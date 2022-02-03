import { ChartContext, ChartOptions } from "../../types";
import { Graphs } from "../Graphs";

export const Series = (
  options: ChartOptions,
  {
    enabledGraphNames,
    width,
    // mainGraphPoints,
    inertOpacityStateByGraphName,
    isDragging,
    startIndex,
    endIndex,
    // isHovering,
    // isGrabbingGraphs,
    // activeCursor,
    // mouseX,
    isWheeling,
    canvasHeight,
  }: ChartContext
) => {
  const { element } = createDom();

  return { element };

  function createDom() {
    return Graphs({
      width,
      height: canvasHeight,
      isDragging,
      isWheeling,
      enabledGraphNames,
      inertOpacityStateByGraphName,
      lineJoinByName: options.lineJoin,
      lineWidth: options.overview.lineWidth,
      domain: options.domain,
      data: options.data,
      colors: options.colors,
      graphNames: options.graphNames,
      startIndex,
      endIndex,
    });
  }
};
