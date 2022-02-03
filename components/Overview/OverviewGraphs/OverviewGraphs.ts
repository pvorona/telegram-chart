import { observable } from "@pvorona/observable";
import { ChartContext, ChartOptions } from "../../../types";
import { Component } from "../../types";
import { Graphs } from "../../Graphs";

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 2;

export const OverviewGraphs: Component<ChartOptions, ChartContext> = (
  options,
  context
) => {
  const {
    isDragging,
    isWheeling,
    width,
    enabledGraphNames,
    inertOpacityStateByGraphName,
  } = context;

  const canvasCssHeight =
    options.overview.height - 2 * VIEWBOX_TOP_BOTTOM_BORDER_WIDTH;

  const graphs = createDOM();

  return { element: graphs.element };

  function createDOM() {
    const graphs = Graphs({
      isDragging,
      isWheeling,
      width,
      height: observable(canvasCssHeight),
      enabledGraphNames,
      inertOpacityStateByGraphName,
      lineJoinByName: options.lineJoin,
      lineWidth: options.overview.lineWidth,
      domain: options.domain,
      data: options.data,
      colors: options.colors,
      graphNames: options.graphNames,
      startIndex: observable(0),
      endIndex: observable(options.total - 1),
    });

    return graphs;
    // graphs.element.style.marginTop = `${VIEWBOX_TOP_BOTTOM_BORDER_WIDTH}px`;
  }
};
