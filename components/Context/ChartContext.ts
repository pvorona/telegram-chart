import {
  effect,
  observable,
  computeLazy,
  animationObservable,
  observe,
  transition,
  groupTransition,
  Transition,
  resetWhenInactive,
} from "@pvorona/observable";
import { ChartOptions } from "../../types";
import {
  Cursor,
  cursor,
  FAST_TRANSITIONS_TIME,
  LONG_TRANSITIONS_TIME,
  MIN_HEIGHT,
  VERY_FAST_TRANSITIONS_TIME,
  WHEEL_CLEAR_TIMEOUT,
} from "../constants";
import { OpacityState, Point, EnabledGraphNames } from "../types";
import { mapDataToCoords, getMinMax, max, min } from "../../util";
import { easeInOutQuart, linear } from "../../easings";

export const ChartContext = (options: ChartOptions) => {
  const width = observable(options.width);
  const height = observable(options.height);
  const canvasHeight = observable(computeCanvasHeight(height.get()));
  const startIndex = observable(options.viewBox.startIndex);
  const endIndex = observable(options.viewBox.endIndex);
  const mouseX = observable(0);
  const isHovering = observable(false);
  const isDragging = observable(false);
  const isWheeling = resetWhenInactive({ delay: WHEEL_CLEAR_TIMEOUT })(
    observable(false)
  );
  const isGrabbingGraphs = observable(false);
  const activeCursor = observable<Cursor>(cursor.default);
  const enabledStateByGraphName = observable(
    options.graphNames.reduce(
      (state, graphName) => ({
        ...state,
        [graphName]: options.visibility[graphName],
      }),
      {} as EnabledGraphNames
    )
  );

  function computeCanvasHeight(containerHeight: number) {
    return Math.max(
      containerHeight -
        options.overview.height -
        options.x.tick.height -
        options.x.tick.margin -
        options.x.label.fontSize -
        options.x.marginBottom -
        options.x.marginTop,
      MIN_HEIGHT
    );
  }

  observe([height], (height) => {
    canvasHeight.set(computeCanvasHeight(height));
  });

  const enabledGraphNames = computeLazy(
    [enabledStateByGraphName],
    function enabledGraphNamesCompute(enabledStateByGraphName) {
      return options.graphNames.filter(
        (graphName) => enabledStateByGraphName[graphName]
      );
    }
  );
  const isAnyGraphEnabled = computeLazy(
    [enabledGraphNames],
    (enabledGraphNames) => {
      return Boolean(enabledGraphNames.length);
    }
  );
  const inertStartIndex = animationObservable(
    startIndex,
    transition(startIndex.get(), VERY_FAST_TRANSITIONS_TIME, linear)
  );
  const inertEndIndex = animationObservable(
    endIndex,
    transition(endIndex.get(), VERY_FAST_TRANSITIONS_TIME, linear)
  );

  // A. min + max
  // B. { min, max }
  // C. { Graph1: { min, max }, Graph2: { min, max } } - useful for gradient

  // C1
  const visibleMinMaxByGraphName = computeLazy(
    [startIndex, endIndex, enabledGraphNames],
    (startIndex, endIndex, enabledGraphNames) => {
      const result: { [graphName: string]: { min: number; max: number } } = {};

      for (let i = 0; i < enabledGraphNames.length; i++) {
        const graphName = enabledGraphNames[i];

        result[graphName] = getMinMax(
          startIndex,
          endIndex,
          options.data[graphName]
        );
      }

      return result;
    }
  );

  const visibleMax = computeLazy(
    [visibleMinMaxByGraphName, enabledGraphNames],
    (visibleMinMaxByGraphName, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMax.get();

      let result = -Infinity;

      for (const graphName of enabledGraphNames) {
        result = max(result, visibleMinMaxByGraphName[graphName].max);
      }

      return result;
    }
  );

  const visibleMin = computeLazy(
    [visibleMinMaxByGraphName, enabledGraphNames],
    (visibleMinMaxByGraphName, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMin.get();

      let result = +Infinity;

      for (const graphName of enabledGraphNames) {
        result = min(result, visibleMinMaxByGraphName[graphName].min);
      }

      return result;
    }
  );

  const inertVisibleMax = animationObservable(
    visibleMax,
    transition(visibleMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );

  const inertVisibleMin = animationObservable(
    visibleMin,
    transition(visibleMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );

  const prevVisibleMax = observable(+Infinity);

  effect([visibleMax], (visibleMax) => {
    prevVisibleMax.set(visibleMax);
  });

  const prevVisibleMin = observable(-Infinity);

  effect([visibleMin], (visibleMin) => {
    prevVisibleMin.set(visibleMin);
  });

  // why lazy
  const opacityStateByGraphName = computeLazy(
    [enabledStateByGraphName],
    function opacityStateByGraphNameCompute(enabledStateByGraphName) {
      return options.graphNames.reduce(
        (state, graphName) => ({
          ...state,
          [graphName]: Number(enabledStateByGraphName[graphName]),
        }),
        {} as OpacityState
      );
    }
  );
  const inertOpacityStateByGraphName = animationObservable(
    opacityStateByGraphName,
    groupTransition(
      options.graphNames.reduce(
        (state, graphName) => ({
          ...state,
          [graphName]: transition(
            opacityStateByGraphName.get()[graphName],
            LONG_TRANSITIONS_TIME,
            easeInOutQuart
          ),
        }),
        {} as { [key: string]: Transition<number> }
      )
    )
  );

  const mainGraphPoints = computeLazy(
    [
      inertStartIndex,
      inertEndIndex,
      inertVisibleMax,
      inertVisibleMin,
      width,
      canvasHeight,
    ],
    function computeVisibleSeriesPoints(
      startIndex,
      endIndex,
      max,
      min,
      width,
      canvasHeight
    ) {
      return options.graphNames.reduce(
        (points, graphName) => ({
          ...points,
          [graphName]: mapDataToCoords(
            options.data[graphName],
            options.domain,
            max,
            min,
            {
              width: width * devicePixelRatio,
              height: canvasHeight * devicePixelRatio,
            },
            { startIndex, endIndex },
            options.lineWidth * devicePixelRatio
          ),
        }),
        {} as { [key: string]: Point[] }
      );
    }
  );

  observe(
    [isDragging, isWheeling, isGrabbingGraphs],
    (isDragging, isWheeling, isGrabbingGraphs) => {
      if (isDragging || isWheeling || isGrabbingGraphs) {
        inertVisibleMax.setTransition(
          transition(inertVisibleMax.get(), FAST_TRANSITIONS_TIME, linear)
        );
        inertVisibleMin.setTransition(
          transition(inertVisibleMin.get(), FAST_TRANSITIONS_TIME, linear)
        );
      } else {
        inertVisibleMax.setTransition(
          transition(
            inertVisibleMax.get(),
            LONG_TRANSITIONS_TIME,
            easeInOutQuart
          )
        );
        inertVisibleMin.setTransition(
          transition(
            inertVisibleMin.get(),
            LONG_TRANSITIONS_TIME,
            easeInOutQuart
          )
        );
      }
    }
  );

  effect([activeCursor], (activeCursor) => {
    for (const key in cursor) {
      const className = cursor[key as keyof typeof cursor];

      if (className) {
        document.body.classList.remove(className);
      }
    }

    if (activeCursor) {
      document.body.classList.add(activeCursor);
    }
  });

  return {
    isHovering,
    isDragging,
    isWheeling,
    isGrabbingGraphs,
    activeCursor,
    enabledStateByGraphName,
    enabledGraphNames,
    isAnyGraphEnabled,
    mainGraphPoints,
    visibleMinMaxByGraphName,
    startIndex,
    endIndex,
    inertStartIndex,
    inertEndIndex,
    mouseX,
    inertOpacityStateByGraphName,
    visibleMax,
    visibleMin,
    prevVisibleMax,
    prevVisibleMin,
    width,
    canvasHeight,
    height,
  };
};

function createMinMaxViewByGraphName(startIndex, endIndex, enabledGraphNames) {
  const visibleMinMaxByGraphName = computeLazy(
    [startIndex, endIndex, enabledGraphNames],
    (startIndex, endIndex, enabledGraphNames) => {
      const result: { [graphName: string]: { min: number; max: number } } = {};

      for (let i = 0; i < enabledGraphNames.length; i++) {
        const graphName = enabledGraphNames[i];

        result[graphName] = getMinMax(
          startIndex,
          endIndex,
          options.data[graphName]
        );
      }

      return result;
    }
  );

  const visibleMax = computeLazy(
    [visibleMinMaxByGraphName, enabledGraphNames],
    (visibleMinMaxByGraphName, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMax.get();

      let result = -Infinity;

      for (const graphName of enabledGraphNames) {
        result = max(result, visibleMinMaxByGraphName[graphName].max);
      }

      return result;
    }
  );

  const visibleMin = computeLazy(
    [visibleMinMaxByGraphName, enabledGraphNames],
    (visibleMinMaxByGraphName, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMin.get();

      let result = +Infinity;

      for (const graphName of enabledGraphNames) {
        result = min(result, visibleMinMaxByGraphName[graphName].min);
      }

      return result;
    }
  );

  return { visibleMinMaxByGraphName, visibleMin, visibleMax };
}
