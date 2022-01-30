import {
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  transition,
} from "@pvorona/observable";
import { renderLineSeriesWithAreaGradient } from "../renderers";
import { ChartContext, ChartOptions } from "../../types";
import { easeInOutQuart, linear } from "../../easings";
import {
  handleDrag,
  mapDataToCoords,
  getMaxValue,
  getMinValue,
  ensureInBounds,
} from "../../util";
import {
  cursor,
  FAST_TRANSITIONS_TIME,
  LONG_TRANSITIONS_TIME,
} from "../constants";
import { Point, Component } from "../types";
import { createGraphs } from "../Chart/createGraphs";

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 2;
const minimalPixelsBetweenResizers = 10;

export const Overview: Component<ChartOptions, ChartContext> = (
  options,
  {
    isDragging,
    isWheeling,
    activeCursor,
    startIndex,
    endIndex,
    width,
    enabledGraphNames,
    inertOpacityStateByGraphName,
  }
) => {
  const canvasCssHeight =
    options.overview.height - 2 * VIEWBOX_TOP_BOTTOM_BORDER_WIDTH;

  const left = observable(
    (startIndex.get() / (options.total - 1)) * width.get()
  );

  const right = observable(
    (endIndex.get() / (options.total - 1)) * width.get()
  );

  const overallMax = computeLazy([enabledGraphNames], (enabledGraphNames) => {
    if (enabledGraphNames.length === 0) return prevOverallMax.get();

    // can remove unnecessary abstraction
    return getMaxValueInRange(0, options.total - 1, enabledGraphNames);
  });

  const prevOverallMax = observable(Infinity);

  effect([overallMax], (overallMax) => {
    prevOverallMax.set(overallMax);
  });

  const overallMin = computeLazy([enabledGraphNames], (enabledGraphNames) => {
    if (enabledGraphNames.length === 0) return prevOverallMin.get();

    return getMinValueInRange(0, options.total - 1, enabledGraphNames);
  });

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
    [inertOverallMax, inertOverallMin, width],
    (inertOverallMax, inertOverallMin, width) => {
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
            { startIndex: 0, endIndex: options.total - 1 },
            options.lineWidth * devicePixelRatio
          ),
        }),
        {} as { [key: string]: Point[] }
      );
    }
  );

  observe([startIndex, width], (startIndex, width) => {
    const newLeft = (startIndex / (options.total - 1)) * width;

    if (!areNumbersClose(left.get(), newLeft)) {
      left.set(newLeft);
    }
  });

  observe([endIndex, width], (endIndex, width) => {
    const newRight = (endIndex / (options.total - 1)) * width;

    if (!areNumbersClose(right.get(), newRight)) {
      right.set(newRight);
    }
  });

  observe([left], (left) => {
    const newStartIndex = (left / width.get()) * (options.total - 1);

    if (!areNumbersClose(startIndex.get(), newStartIndex)) {
      startIndex.set(newStartIndex);
    }
  });

  observe([right], (right) => {
    const newEndIndex = Math.min(
      (right / width.get()) * (options.total - 1),
      options.total - 1
    );

    if (!areNumbersClose(endIndex.get(), newEndIndex)) {
      endIndex.set(newEndIndex);
    }
  });

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

  const {
    element,
    resizerLeft,
    resizerRight,
    viewBoxElement,
    graphs,
    leftSide,
    rightSide,
  } = createDom({
    width: width.get(),
    height: options.overview.height,
    canvasCssHeight,
    edgeColor: options.overview.edgeColor,
    backdropColor: options.overview.overlayColor,
  });

  effect([left], (left) => {
    viewBoxElement.style.left = `${left}px`;
  });

  effect([right, width], (right, width) => {
    viewBoxElement.style.right = `${width - right}px`;
  });

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

  const boundingRect = element.getBoundingClientRect(); // Does not work: capturing geometry before mounting

  let cursorResizerDelta = 0;

  leftSide.addEventListener("mousedown", onLeftSideClick);
  rightSide.addEventListener("mousedown", onRightSideClick);

  function onLeftSideClick(event: MouseEvent) {
    const boundingRect = element.getBoundingClientRect();
    const viewBoxWidth = right.get() - left.get();
    const newLeft = ensureInBounds(
      getX(event) - viewBoxWidth / 2 - boundingRect.left,
      0,
      width.get()
    );
    const newRight = newLeft + viewBoxWidth;

    left.set(newLeft);
    right.set(newRight);
  }

  function onRightSideClick(event: MouseEvent) {
    const boundingRect = element.getBoundingClientRect();
    const viewBoxWidth = right.get() - left.get();
    const newRight = ensureInBounds(
      getX(event) + viewBoxWidth / 2 - boundingRect.left,
      0,
      width.get()
    );
    const newLeft = newRight - viewBoxWidth;

    left.set(newLeft);
    right.set(newRight);
  }

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
    activeCursor.set(cursor.resize);
    cursorResizerDelta = getX(e) - (left.get() - boundingRect.left);
  }

  function removeLeftResizerListener() {
    isDragging.set(false);
    activeCursor.set(cursor.default);
  }

  function onLeftResizerMouseMove(e: MouseEvent) {
    const leftVar = ensureInOverviewBounds(getX(e) - cursorResizerDelta);
    left.set(
      ensureInBounds(leftVar, 0, right.get() - minimalPixelsBetweenResizers)
    );
  }

  function onRightResizerMouseDown(e: MouseEvent) {
    cursorResizerDelta = getX(e) - (right.get() - boundingRect.left);
    isDragging.set(true);
    activeCursor.set(cursor.resize);
  }

  function removeRightResizerListener() {
    isDragging.set(false);
    activeCursor.set(cursor.default);
  }

  function ensureInOverviewBounds(x: number) {
    return ensureInBounds(x, 0, width.get());
  }

  function onViewBoxElementMouseDown(e: MouseEvent) {
    cursorResizerDelta = getX(e) - (left.get() - boundingRect.left);
    isDragging.set(true);
    activeCursor.set(cursor.grabbing);
  }

  function onViewBoxElementMouseUp() {
    isDragging.set(false);
    activeCursor.set(cursor.default);
  }

  function onViewBoxElementMouseMove(e: MouseEvent) {
    const widthVar = right.get() - left.get();
    const nextLeft = getX(e) - cursorResizerDelta;
    const stateLeft = ensureInBounds(nextLeft, 0, width.get() - widthVar);
    left.set(stateLeft);
    right.set(stateLeft + widthVar);
  }

  function onRightResizerMouseMove(e: MouseEvent) {
    const rightVar = ensureInOverviewBounds(getX(e) - cursorResizerDelta);
    right.set(
      ensureInBounds(
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

  function getX(event: MouseEvent) {
    return event.clientX - boundingRect.left;
  }

  return { element };
};

function createDom({
  width,
  height,
  edgeColor,
  backdropColor,
  canvasCssHeight,
}: {
  width: number;
  height: number;
  canvasCssHeight: number;
  edgeColor: string;
  backdropColor: string;
}) {
  const containerClassName = "overview";
  const element = document.createElement("div");
  element.className = containerClassName;
  element.style.height = `${height}px`;
  // element.style.padding = `${2}px 0`;
  const resizerLeft = document.createElement("div");
  resizerLeft.style.backgroundColor = edgeColor;
  resizerLeft.className = "overview__resizer overview__resizer--left";
  const resizerRight = document.createElement("div");
  resizerRight.style.backgroundColor = edgeColor;
  resizerRight.className = "overview__resizer overview__resizer--right";
  const viewBoxElement = document.createElement("div");
  viewBoxElement.style.borderColor = edgeColor;
  viewBoxElement.className = "overview__viewbox";

  const leftSide = document.createElement("div");
  leftSide.style.backgroundColor = backdropColor;
  leftSide.className = "overview__left";
  const rightSide = document.createElement("div");
  rightSide.style.backgroundColor = backdropColor;
  rightSide.className = "overview__right";

  viewBoxElement.appendChild(leftSide);
  viewBoxElement.appendChild(resizerLeft);
  viewBoxElement.appendChild(resizerRight);
  viewBoxElement.appendChild(rightSide);

  const graphs = createGraphs({
    width,
    height: canvasCssHeight,
  });
  graphs.element.style.marginTop = `${VIEWBOX_TOP_BOTTOM_BORDER_WIDTH}px`;

  element.appendChild(graphs.element);
  element.appendChild(viewBoxElement);

  // return html`
  //   <div ref="element" class="overview" style="height: ${height}px">
  //     ${withRef('graphs', createGraphs({ width, height }))}
  //     <div ref="viewbox" class="overview__viewbox">
  //       <div ref="resizerLeft" class="overview__resizer overview__resizer--left"></div>
  //       <div ref="resizerRight" class="overview__resizer overview__resizer--right"></div>
  //     </div>
  //   </div>
  // `;

  return {
    element,
    resizerLeft,
    resizerRight,
    viewBoxElement,
    graphs,
    leftSide,
    rightSide,
  };
}

function areNumbersClose(a: number, b: number, epsilon = 1e-3) {
  return Math.abs(a - b) <= epsilon;
}
