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
import { mapDataToCoords, createMinMaxView } from "../../util";
import { easeInOutQuart, linear } from "../../easings";

export const ChartContext = (options: ChartOptions) => {
  const globalStartIndex = observable(0);
  const globalEndIndex = observable(options.total - 1);
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

  const {
    minMaxByGraphName: visibleMinMaxByGraphName,
    min: visibleMin,
    max: visibleMax,
  } = createMinMaxView(startIndex, endIndex, enabledGraphNames, options.data);

  const inertVisibleMax = animationObservable(
    visibleMax,
    transition(visibleMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );

  const inertVisibleMin = animationObservable(
    visibleMin,
    transition(visibleMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
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
              width: width,
              height: canvasHeight,
            },
            { startIndex, endIndex },
            options.lineWidth
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
    width,
    canvasHeight,
    height,
    globalMax,
    globalMin,
    inertGlobalMax,
    inertGlobalMin,
    globalStartIndex,
    globalEndIndex,
  };
};
