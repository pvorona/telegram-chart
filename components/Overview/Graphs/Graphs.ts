import {
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  transition,
} from "@pvorona/observable";
import { renderLineSeriesWithAreaGradient } from "../../renderers";
import { ChartContext, ChartOptions, CssPixel } from "../../../types";
import { easeInOutQuart, linear } from "../../../easings";
import { mapDataToCoords, createMinMaxView } from "../../../util";
import { FAST_TRANSITIONS_TIME, LONG_TRANSITIONS_TIME } from "../../constants";
import { Point, Component } from "../../types";
import { createGraphs } from "../../Graphs/createGraphs";
import { cssToBitMap } from "../../../util/cssToBitMap";

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 2;

export const Graphs: Component<ChartOptions, ChartContext> = (
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

  const globalStartIndex = observable(0);
  const globalEndIndex = observable(options.total - 1);
  const canvasCssHeight = (options.overview.height -
    2 * VIEWBOX_TOP_BOTTOM_BORDER_WIDTH) as CssPixel;
  const { max: globalMax, min: globalMin } = createMinMaxView(
    globalStartIndex,
    globalEndIndex,
    enabledGraphNames,
    options.data
  );

  const inertOverallMax = animationObservable(
    globalMax,
    transition(globalMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );
  const inertOverallMin = animationObservable(
    globalMin,
    transition(globalMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );

  const overviewGraphPoints = computeLazy(
    [globalStartIndex, globalEndIndex, inertOverallMax, inertOverallMin, width],
    (
      globalStartIndex,
      globalEndIndex,
      inertOverallMax,
      inertOverallMin,
      width
    ) => {
      return options.graphNames.reduce(
        (points, graphName) => ({
          ...points,
          [graphName]: mapDataToCoords(
            options.data[graphName],
            options.domain,
            inertOverallMax,
            inertOverallMin,
            {
              width: width,
              height: canvasCssHeight,
            },
            { startIndex: globalStartIndex, endIndex: globalEndIndex },
            options.lineWidth as CssPixel
          ),
        }),
        {} as { [key: string]: Point[] }
      );
    }
  );

  observe([isDragging, isWheeling], (isDragging, isWheeling) => {
    if (isDragging || isWheeling) {
      inertOverallMax.setTransition(
        transition(inertOverallMax.get(), FAST_TRANSITIONS_TIME, linear)
      );
      inertOverallMin.setTransition(
        transition(inertOverallMin.get(), FAST_TRANSITIONS_TIME, linear)
      );
    } else {
      inertOverallMax.setTransition(
        transition(inertOverallMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
      );
      inertOverallMin.setTransition(
        transition(inertOverallMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
      );
    }
  });

  const graphs = createDOM();

  effect([width], (width) => {
    graphs.canvas.width = cssToBitMap(width);
    graphs.canvas.height = cssToBitMap(canvasCssHeight);

    updatePoints(overviewGraphPoints.get(), inertOpacityStateByGraphName.get());
  });

  effect(
    [overviewGraphPoints, inertOpacityStateByGraphName],
    (overviewGraphPoints, inertOpacityStateByGraphName) => {
      graphs.context.clearRect(
        0,
        0,
        cssToBitMap(width.get()),
        cssToBitMap(canvasCssHeight)
      );

      updatePoints(overviewGraphPoints, inertOpacityStateByGraphName);
    }
  );

  function updatePoints(
    overviewGraphPoints: { [key: string]: Point[] },
    inertOpacityStateByGraphName: { [key: string]: number }
  ) {
    renderLineSeriesWithAreaGradient({
      opacityState: inertOpacityStateByGraphName,
      points: overviewGraphPoints,
      context: graphs.context,
      graphNames: options.graphNames,
      lineWidth: options.overview.lineWidth as CssPixel,
      strokeStyles: options.colors,
      height: canvasCssHeight,
      width: width.get(),
      // Use `miter` line join in overview?
      lineJoinByName: options.lineJoin,
    });
  }

  return { element: graphs.element };

  function createDOM() {
    const graphs = createGraphs({
      width: width.get(),
      height: canvasCssHeight,
    });
    graphs.element.style.marginTop = `${VIEWBOX_TOP_BOTTOM_BORDER_WIDTH}px`;

    return graphs;
  }
};
