import {
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  transition,
} from "@pvorona/observable";
import { renderLineSeriesWithAreaGradient } from "../../renderers";
import { ChartContext, ChartOptions } from "../../../types";
import { easeInOutQuart, linear } from "../../../easings";
import { mapDataToCoords, createMinMaxView } from "../../../util";
import { FAST_TRANSITIONS_TIME, LONG_TRANSITIONS_TIME } from "../../constants";
import { Point, Component } from "../../types";
import { createGraphs } from "../../Graphs/createGraphs";

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
  const canvasCssHeight =
    options.overview.height - 2 * VIEWBOX_TOP_BOTTOM_BORDER_WIDTH;

  const { max, min } = createMinMaxView(
    globalStartIndex,
    globalEndIndex,
    enabledGraphNames,
    options.data
  );

  const inertOverallMax = animationObservable(
    max,
    transition(max.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );
  const inertOverallMin = animationObservable(
    min,
    transition(min.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
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
              width: width * devicePixelRatio,
              height: canvasCssHeight * devicePixelRatio,
            },
            { startIndex: globalStartIndex, endIndex: globalEndIndex },
            options.lineWidth * devicePixelRatio
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
    graphs.canvas.width = width * window.devicePixelRatio;
    graphs.canvas.height = canvasCssHeight * window.devicePixelRatio;

    updatePoints(overviewGraphPoints.get(), inertOpacityStateByGraphName.get());
  });

  effect(
    [overviewGraphPoints, inertOpacityStateByGraphName],
    (overviewGraphPoints, inertOpacityStateByGraphName) => {
      graphs.context.clearRect(
        0,
        0,
        width.get() * devicePixelRatio,
        canvasCssHeight * devicePixelRatio
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
      lineWidth: options.overview.lineWidth,
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
