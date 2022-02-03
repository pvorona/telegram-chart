import {
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  transition,
  Observable,
  Gettable,
} from "@pvorona/observable";
import { easeInOutQuart, linear } from "../../easings";
import { getMaxValue, getMinValue, mapDataToCoords } from "../../util";
import { FAST_TRANSITIONS_TIME, LONG_TRANSITIONS_TIME } from "../constants";
import { createGraphs } from ".";
import { renderLineSeriesWithAreaGradient } from "../renderers";
import { Point } from "../types";

type Inputs = {
  width: Observable<number> & Gettable<number>;
  height: Observable<number> & Gettable<number>;
  isDragging: Observable<boolean> & Gettable<boolean>;
  isWheeling: Observable<boolean> & Gettable<boolean>;
  enabledGraphNames: Observable<string[]> & Gettable<string[]>;
  inertOpacityStateByGraphName: Observable<{ [key: string]: number }> &
    Gettable<{ [key: string]: number }>;
  graphNames: string[];
  domain: number[];
  data: { [key: string]: number[] };
  lineWidth: number;
  lineJoinByName: { [key: string]: CanvasLineJoin };
  colors: { [key: string]: string };

  startIndex: Observable<number> & Gettable<number>;
  endIndex: Observable<number> & Gettable<number>;
};

export const Graphs = (options: Inputs) => {
  const {
    width,
    height,
    lineWidth,
    lineJoinByName,
    isDragging,
    isWheeling,
    enabledGraphNames,
    inertOpacityStateByGraphName,
    graphNames,
    domain,
    data,
    colors,
    startIndex,
    endIndex,
  } = options;

  const overallMax = computeLazy(
    [enabledGraphNames, startIndex, endIndex],
    (enabledGraphNames, startIndex, endIndex) => {
      if (enabledGraphNames.length === 0) return prevOverallMax.get();

      return getMaxValueInRange(startIndex, endIndex, enabledGraphNames);
    }
  );

  const prevOverallMax = observable(Infinity);

  effect([overallMax], (overallMax) => {
    prevOverallMax.set(overallMax);
  });

  const overallMin = computeLazy(
    [enabledGraphNames, startIndex, endIndex],
    (enabledGraphNames, startIndex, endIndex) => {
      if (enabledGraphNames.length === 0) return prevOverallMin.get();

      return getMinValueInRange(startIndex, endIndex, enabledGraphNames);
    }
  );

  const prevOverallMin = observable(-Infinity);

  effect([overallMin], (overallMin) => {
    prevOverallMin.set(overallMin);
  });

  const inertOverallMax = animationObservable(
    overallMax,
    transition(overallMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );
  const inertOverallMin = animationObservable(
    overallMin,
    transition(overallMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );

  const overviewGraphPoints = computeLazy(
    [inertOverallMax, inertOverallMin, width, height, startIndex, endIndex],
    (inertOverallMax, inertOverallMin, width, height, startIndex, endIndex) => {
      return graphNames.reduce(
        (points, graphName) => ({
          ...points,
          [graphName]: mapDataToCoords(
            data[graphName],
            domain,
            inertOverallMax,
            inertOverallMin,
            {
              width: width * devicePixelRatio,
              height: height * devicePixelRatio,
            },
            { startIndex, endIndex },
            lineWidth * devicePixelRatio
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

  effect([width, height], (width, height) => {
    graphs.canvas.width = width * window.devicePixelRatio;
    graphs.canvas.height = height * window.devicePixelRatio;

    updatePoints(overviewGraphPoints.get(), inertOpacityStateByGraphName.get());
  });

  effect(
    [overviewGraphPoints, inertOpacityStateByGraphName],
    (overviewGraphPoints, inertOpacityStateByGraphName) => {
      graphs.context.clearRect(
        0,
        0,
        width.get() * devicePixelRatio,
        height.get() * devicePixelRatio
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
      graphNames: graphNames,
      lineWidth,
      strokeStyles: colors,
      height: height.get(),
      width: width.get(),
      // Use `miter` line join in overview?
      lineJoinByName: lineJoinByName,
    });
  }

  // COMBINE THESE 2
  function getMaxValueInRange(
    startIndex: number,
    endIndex: number,
    graphNames: string[]
  ) {
    return getMaxValue({ startIndex, endIndex }, getValues(graphNames));
  }

  function getMinValueInRange(
    startIndex: number,
    endIndex: number,
    graphNames: string[]
  ) {
    return getMinValue({ startIndex, endIndex }, getValues(graphNames));
  }

  function getValues(graphNames: string[]) {
    return graphNames.map((graphName) => data[graphName]);
  }

  return { element: graphs.element };

  function createDOM() {
    const graphs = createGraphs({
      width: width.get(),
      height: height.get(),
    });
    // graphs.element.style.marginTop = `${VIEWBOX_TOP_BOTTOM_BORDER_WIDTH}px`;

    return graphs;
  }
};
