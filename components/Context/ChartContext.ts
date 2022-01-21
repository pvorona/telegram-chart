import {
  effect,
  observable,
  computeLazy,
  animationObservable,
  observe,
  transition,
  groupTransition,
  Transition,
} from "@pvorona/observable";
import { ChartOptions } from "../../types";
import {
  cursors,
  FAST_TRANSITIONS_TIME,
  LONG_TRANSITIONS_TIME,
  VERY_FAST_TRANSITIONS_TIME,
} from "../constants";
import { OpacityState, Point, EnabledGraphNames } from "../types";
import { mapDataToCoords, getMaxValue, getMinValue } from "../../util";
import { easeInOutQuart, linear } from "../../easings";

export const ChartContext = (options: ChartOptions) => {
  const width = observable(options.width);
  const height = observable(
    options.height -
      options.overviewHeight -
      options.x.tick.height -
      options.x.tick.margin -
      options.x.label.fontSize -
      options.x.marginBottom
  );
  const startIndex = observable(options.viewBox.startIndex);
  const endIndex = observable(options.viewBox.endIndex);
  const mouseX = observable(0);
  const isHovering = observable(false);
  const isDragging = observable(false);
  const isWheeling = observable(false);
  const isGrabbingGraphs = observable(false);
  const activeCursor = observable(cursors.default);
  const enabledStateByGraphName = observable(
    options.graphNames.reduce(
      (state, graphName) => ({
        ...state,
        [graphName]: true,
      }),
      {} as EnabledGraphNames
    )
  );
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

  const visibleMax = computeLazy(
    [startIndex, endIndex, enabledGraphNames],
    (startIndex, endIndex, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMax.get();

      return getMaxValueInRange(startIndex, endIndex, enabledGraphNames);
    }
    // (startIndex, endIndex, enabledGraphNames) => beautifyNumber(getMaxValueInRange(startIndex, endIndex, enabledGraphNames))
  );
  const inertVisibleMax = animationObservable(
    visibleMax,
    transition(visibleMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );

  const visibleMin = computeLazy(
    [startIndex, endIndex, enabledGraphNames],
    (startIndex, endIndex, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMin.get();

      return getMinValueInRange(startIndex, endIndex, enabledGraphNames);
    }
    // (startIndex, endIndex, enabledGraphNames) => beautifyNumber(getMaxValueInRange(startIndex, endIndex, enabledGraphNames))
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
          [graphName]: transition(1, LONG_TRANSITIONS_TIME, easeInOutQuart),
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
      height,
    ],
    function mainGraphPointsCompute(
      startIndex,
      endIndex,
      max,
      min,
      width,
      height
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
              height: height * devicePixelRatio,
            },
            { startIndex, endIndex },
            options.lineWidth * devicePixelRatio,
            50
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

  effect([activeCursor], (cursor) => {
    document.body.style.cursor = cursor;
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
    height,
  };

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
    return graphNames.map((graphName) => options.data[graphName]);
  }
};