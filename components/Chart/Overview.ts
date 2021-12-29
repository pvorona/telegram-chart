import { renderGraphs } from "../Graphs";
import { ChartOptions } from "../../types";
import { easeInOutQuart, linear } from "../../easings";
import {
  handleDrag,
  mapDataToCoords,
  transition,
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  getMaxValue,
  getMinValue,
  keepInBounds,
} from "../../util";
import { LazyObservable, ObservableValue } from "../../util/observable/types";
import {
  // cursors,
  FAST_TRANSITIONS_TIME,
  LONG_TRANSITIONS_TIME,
} from "./constants";
import { Point } from "./types";
import { createGraphs } from "./createGraphs";

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 4;
const minimalPixelsBetweenResizers = 10;

// type Component <Props> = (p: Props) => { element: HTMLElement }

export function Overview({
  startIndex,
  endIndex,
  width,
  isDragging,
  isWheeling,
  options,
  enabledGraphNames,
  inertOpacityStateByGraphName,
}: {
  startIndex: ObservableValue<number>;
  endIndex: ObservableValue<number>;
  width: ObservableValue<number>;
  isDragging: ObservableValue<boolean>;
  isWheeling: ObservableValue<boolean>;
  options: ChartOptions;
  enabledGraphNames: LazyObservable<string[]>;
  inertOpacityStateByGraphName: LazyObservable<{ [key: string]: number }>;
}) {
  const left = observable(
    (startIndex.get() / (options.total - 1)) * width.get()
  );
  const right = observable(
    (endIndex.get() / (options.total - 1)) * width.get()
  );

  const { element, resizerLeft, resizerRight, viewBoxElement, graphs } =
    createOverview({
      width: width.get(),
      left: left.get(),
    });

  const boundingRect = element.getBoundingClientRect();

  let cursorResizerDelta = 0;

  observe([startIndex, width], function observeStartIndexAndWidth (startIndex, width) {
    left.set((startIndex / (options.total - 1)) * width);
  })
  
  observe([endIndex, width], function observeEndIndexAndWidth (endIndex, width) {
    right.set((endIndex / (options.total - 1)) * width);
  })
  
  observe([left], function computeStartIndex(left) {
    startIndex.set((left / width.get()) * (options.total - 1));
  });

  observe([right], function computeEndIndex(right) {
    endIndex.set(
      Math.min((right / width.get()) * (options.total - 1), options.total - 1)
    );
  });

  const overallMax = computeLazy(
    [enabledGraphNames],
    function getTotalMaxCompute(enabledGraphNames) {
      // can remove unnecessary abstraction
      return getMaxValueInRange(0, options.total - 1, enabledGraphNames);
    }
  );

  const overallMin = computeLazy(
    [enabledGraphNames],
    function getTotalMinCompute(enabledGraphNames) {
      // can remove unnecessary abstraction
      return getMinValueInRange(0, options.total - 1, enabledGraphNames);
    }
  );

  const inertOverallMax = animationObservable(
    overallMax,
    transition(overallMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );
  const inertOverallMin = animationObservable(
    overallMin,
    transition(overallMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );

  const overviewGraphPoints = computeLazy(
    [inertOverallMax, inertOverallMin, width],
    function overviewGraphPointsCompute(
      inertOverallMax,
      inertOverallMin,
      width
    ) {
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
              height:
                (options.overviewHeight - VIEWBOX_TOP_BOTTOM_BORDER_WIDTH * 2) *
                devicePixelRatio,
            },
            { startIndex: 0, endIndex: options.total - 1 },
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

  effect([left], function updateViewBoxLeftEffect(left) {
    viewBoxElement.style.left = `${left}px`;
  });

  effect([right, width], function updateViewBoxRightEffect(right, width) {
    viewBoxElement.style.right = `${width - right}px`;
  });

  effect(
    [inertOpacityStateByGraphName, overviewGraphPoints, width],
    function updateOverviewGraphEffect(opacityState, points, width) {
      graphs.canvas.width = width * window.devicePixelRatio; // only needs to be run when sizes change
      graphs.canvas.height = options.overviewHeight * window.devicePixelRatio; // only needs to be run when sizes change
      renderGraphs({
        opacityState,
        points,
        width,
        context: graphs.context,
        height: options.overviewHeight - 2 * VIEWBOX_TOP_BOTTOM_BORDER_WIDTH,
        graphNames: options.graphNames,
        lineWidth: options.OVERVIEW_LINE_WIDTH,
        strokeStyles: options.colors,
      });
    }
  );

  handleDrag(resizerLeft, {
    onDragStart: onLeftResizerMouseDown,
    onDragMove: onLeftResizerMouseMove,
    onDragEnd: removeLeftResizerListener,
  });
  handleDrag(resizerRight, {
    onDragStart: onRightResizerMouseDown,
    onDragMove: onRightResizerMouseMove,
    onDragEnd: removeRightResizerListener,
  });
  handleDrag(viewBoxElement, {
    onDragStart: onViewBoxElementMouseDown,
    onDragMove: onViewBoxElementMouseMove,
    onDragEnd: onViewBoxElementMouseUp,
  });

  function onLeftResizerMouseDown(e: MouseEvent) {
    isDragging.set(true);
    // activeCursor.set(cursors.resize);
    cursorResizerDelta = getX(e) - (left.get() - boundingRect.left);
  }

  function removeLeftResizerListener() {
    isDragging.set(false);
    // activeCursor.set(cursors.default);
  }

  function onLeftResizerMouseMove(e: MouseEvent) {
    const leftVar = ensureInOverviewBounds(getX(e) - cursorResizerDelta);
    left.set(
      keepInBounds(leftVar, 0, right.get() - minimalPixelsBetweenResizers)
    );
  }

  function onRightResizerMouseDown(e: MouseEvent) {
    cursorResizerDelta = getX(e) - (right.get() - boundingRect.left);
    isDragging.set(true);
    // activeCursor.set(cursors.resize);
  }

  function removeRightResizerListener() {
    isDragging.set(false);
    // activeCursor.set(cursors.default);
  }

  function ensureInOverviewBounds(x: number) {
    return keepInBounds(x, 0, width.get());
  }

  function onViewBoxElementMouseDown(e: MouseEvent) {
    cursorResizerDelta = getX(e) - (left.get() - boundingRect.left);
    isDragging.set(true);
    // activeCursor.set(cursors.grabbing);
  }

  function onViewBoxElementMouseUp() {
    isDragging.set(false);
    // activeCursor.set(cursors.default);
  }

  function onViewBoxElementMouseMove(e: MouseEvent) {
    const widthVar = right.get() - left.get();
    const nextLeft = getX(e) - cursorResizerDelta;
    const stateLeft = keepInBounds(nextLeft, 0, width.get() - widthVar);
    left.set(stateLeft);
    right.set(stateLeft + widthVar);
  }

  function onRightResizerMouseMove(e: MouseEvent) {
    const rightVar = ensureInOverviewBounds(getX(e) - cursorResizerDelta);
    right.set(
      keepInBounds(
        rightVar,
        left.get() + minimalPixelsBetweenResizers,
        rightVar
      )
    );
  }

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

  function createOverview({ width, left }: { width: number; left: number }) {
    const containerClassName = "overview";
    const element = document.createElement("div");
    element.className = containerClassName;
    element.style.height = `${options.overviewHeight}px`;
    const resizerLeft = document.createElement("div");
    resizerLeft.className = "overview__resizer overview__resizer--left";
    const resizerRight = document.createElement("div");
    resizerRight.className = "overview__resizer overview__resizer--right";
    const viewBoxElement = document.createElement("div");
    viewBoxElement.className = "overview__viewbox";
    viewBoxElement.style.left = `${left}px`;
    viewBoxElement.appendChild(resizerLeft);
    viewBoxElement.appendChild(resizerRight);
    const graphs = createGraphs({
      width: width,
      height: options.overviewHeight,
    });
    element.appendChild(graphs.element);
    element.appendChild(viewBoxElement);
    return { element, resizerLeft, resizerRight, viewBoxElement, graphs };
  }

  function getX(event: MouseEvent) {
    return event.clientX - boundingRect.left;
  }

  return { element };
}
