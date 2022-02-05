import {
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  transition,
} from "@pvorona/observable";
import {
  clearRect,
  renderLineSeriesWithAreaGradient,
  setCanvasSize,
} from "../../renderers";
import { ChartContext, ChartOptionsValidated } from "../../../types";
import { easeInOutQuart, linear } from "../../../easings";
import { mapDataToCoords, createMinMaxView, cssToBitMap } from "../../../util";
import { FAST_TRANSITIONS_TIME, LONG_TRANSITIONS_TIME } from "../../constants";
import { Point, Component } from "../../types";
import { createGraphs } from "../../Graphs/createGraphs";
import { validateNonNegativeNumber } from "../../../config/validateNonNegativeNumber";
import { validateCssPixel } from "../../../config/validateCssPixel";

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 2;

export const Graphs: Component<ChartOptionsValidated, ChartContext> = (
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

  const globalStartIndex = observable(validateNonNegativeNumber(0));
  const globalEndIndex = observable(
    validateNonNegativeNumber(options.total - 1)
  );
  const canvasCssHeight = validateCssPixel(
    options.overview.height - 2 * VIEWBOX_TOP_BOTTOM_BORDER_WIDTH
  );
  const { max: globalMax, min: globalMin } = createMinMaxView(
    globalStartIndex,
    globalEndIndex,
    enabledGraphNames,
    options.data
  );

  const inertGlobalMax = animationObservable(
    globalMax,
    transition(globalMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );
  const inertGlobalMin = animationObservable(
    globalMin,
    transition(globalMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );

  const overviewGraphPoints = computeLazy(
    [globalStartIndex, globalEndIndex, inertGlobalMax, inertGlobalMin, width],
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
            options.lineWidth
          ),
        }),
        {} as { [key: string]: Point[] }
      );
    }
  );

  observe([isDragging, isWheeling], (isDragging, isWheeling) => {
    if (isDragging || isWheeling) {
      inertGlobalMax.setTransition(
        transition(inertGlobalMax.get(), FAST_TRANSITIONS_TIME, linear)
      );
      inertGlobalMin.setTransition(
        transition(inertGlobalMin.get(), FAST_TRANSITIONS_TIME, linear)
      );
    } else {
      inertGlobalMax.setTransition(
        transition(inertGlobalMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
      );
      inertGlobalMin.setTransition(
        transition(inertGlobalMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
      );
    }
  });

  const graphs = createDOM();

  updatePoints(overviewGraphPoints.get(), inertOpacityStateByGraphName.get());

  effect(
    [width],
    (width) => {
      setCanvasSize(
        graphs.canvas,
        cssToBitMap(width),
        cssToBitMap(canvasCssHeight)
      );
      updatePoints(
        overviewGraphPoints.get(),
        inertOpacityStateByGraphName.get()
      );
    },
    { fireImmediately: false }
  );

  effect(
    [overviewGraphPoints, inertOpacityStateByGraphName],
    (overviewGraphPoints, inertOpacityStateByGraphName) => {
      clearRect(
        graphs.context,
        cssToBitMap(width.get()),
        cssToBitMap(canvasCssHeight)
      );
      updatePoints(overviewGraphPoints, inertOpacityStateByGraphName);
    },
    { fireImmediately: false }
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
