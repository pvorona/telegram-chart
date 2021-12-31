import { renderGraphs } from "../Graphs";
import { Controls } from "../Controls";
import { ChartContext, ChartOptions } from "../../types";
import { easeInOutQuart, linear } from "../../easings";
import {
  memoizeOne,
  // getShortNumber,
  mapDataToCoords,
  getMaxValue,
  getMinValue,
  transition,
  groupTransition,
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  // compute,
  Transition,
  ensureInBounds,
  getTooltipDateText,
  handleDrag,
} from "../../util";
import {
  MIN_VIEWBOX,
  DOT_SIZE,
  CENTER_OFFSET,
  MIN_HEIGHT,
  WHEEL_CLEAR_TIMEOUT,
  WHEEL_MULTIPLIER,
  DEVIATION_FROM_STRAIGHT_LINE_DEGREES,
  INSTANT_TRANSITION,
  VERY_FAST_TRANSITIONS_TIME,
  FAST_TRANSITIONS_TIME,
  LONG_TRANSITIONS_TIME,
  cursors,
} from "./constants";
import { EnabledGraphNames, OpacityState, Point, Component } from "./types";
import { createGraphs } from "./createGraphs";
import { Overview } from "./Overview";
import { interpolate } from "../../util/interpolatePoint";

export const Chart: Component<ChartOptions, ChartContext> = (
  options,
  context
) => {
  const { isDragging, isWheeling, isGrabbingGraphs, activeCursor } = context;

  const enabledStateByGraphName = observable(
    options.graphNames.reduce(
      (state, graphName) => ({
        ...state,
        [graphName]: true,
      }),
      {} as EnabledGraphNames
    )
  );
  const isHovering = observable(false);
  const mouseX = observable(0);
  const width = observable(options.width);
  const height = observable(options.height - options.overviewHeight);
  const startIndex = observable(options.viewBox.startIndex);
  const endIndex = observable(options.viewBox.endIndex);

  let wheelTimeoutId: number | undefined = undefined;

  const enabledGraphNames = computeLazy(
    [enabledStateByGraphName],
    function enabledGraphNamesCompute(enabledStateByGraphName) {
      return options.graphNames.filter(
        (graphName) => enabledStateByGraphName[graphName]
      );
    }
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

  // why lazy
  const isAnyGraphEnabled = computeLazy(
    [enabledGraphNames],
    function isAnyGraphEnabledCompute(enabledGraphNames) {
      return Boolean(enabledGraphNames.length);
    }
  );

  // why lazy
  const isTooltipVisible = computeLazy(
    [isDragging, isHovering, isWheeling, isGrabbingGraphs, isAnyGraphEnabled],
    function isTooltipVisibleCompute(
      isDragging,
      isHovering,
      isWheeling,
      isGrabbingGraphs,
      isAnyGraphEnabled
    ) {
      return (
        !isWheeling &&
        !isDragging &&
        isHovering &&
        !isGrabbingGraphs &&
        isAnyGraphEnabled
      );
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
    function getMaxCompute(startIndex, endIndex, enabledGraphNames) {
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
    function getMinCompute(startIndex, endIndex, enabledGraphNames) {
      return getMinValueInRange(startIndex, endIndex, enabledGraphNames);
    }
    // (startIndex, endIndex, enabledGraphNames) => beautifyNumber(getMaxValueInRange(startIndex, endIndex, enabledGraphNames))
  );
  const inertVisibleMin = animationObservable(
    visibleMin,
    transition(visibleMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
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

  // can use binary search here
  const tooltipIndex = computeLazy(
    [mouseX, mainGraphPoints, isTooltipVisible],
    function tooltipIndexCompute(x, points, isTooltipVisible) {
      if (!isTooltipVisible) return 0;

      let closestPointIndex = 0;
      for (let i = 1; i < points[options.graphNames[0]].length; i++) {
        const distance = Math.abs(
          points[options.graphNames[0]][i].x / devicePixelRatio - x
        );
        const closesDistance = Math.abs(
          points[options.graphNames[0]][closestPointIndex].x /
            devicePixelRatio -
            x
        );
        if (distance < closesDistance) closestPointIndex = i;
      }
      return closestPointIndex;
    }
  );

  observe(
    [isDragging, isWheeling, isGrabbingGraphs],
    (isDragging, isWheeling, isGrabbingGraphs) => {
      if (isGrabbingGraphs) {
        inertVisibleMax.setTransition(
          transition(inertVisibleMax.get(), INSTANT_TRANSITION, linear)
        );
        inertVisibleMin.setTransition(
          transition(inertVisibleMin.get(), INSTANT_TRANSITION, linear)
        );
      } else if (isDragging || isWheeling) {
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

  const {
    element,
    graphs,
    tooltip,
    tooltipLine,
    tooltipCircles,
    tooltipValues,
    tooltipGraphInfo,
    tooltipDate,
  } = createDOM();

  window.addEventListener("resize", function resizeListener() {
    width.set(element.offsetWidth);
    height.set(
      Math.max(element.offsetHeight - options.overviewHeight, MIN_HEIGHT)
    );
  });

  effect(
    [isTooltipVisible, enabledGraphNames],
    function updateTooltipVisibilityEffect(visible, enabledGraphNames) {
      tooltipLine.style.visibility = visible ? "visible" : "";
      tooltip.style.display = visible ? "block" : "";
      options.graphNames.forEach(
        (graphName) =>
          (tooltipCircles[graphName].style.visibility =
            visible && enabledGraphNames.indexOf(graphName) > -1
              ? "visible"
              : "")
      );
      if (!visible) return;
      options.graphNames.forEach(
        (graphName) =>
          (tooltipGraphInfo[graphName].hidden =
            enabledGraphNames.indexOf(graphName) > -1 ? false : true)
      );
    }
  );

  effect(
    [
      isTooltipVisible,
      mainGraphPoints,
      enabledGraphNames,
      tooltipIndex,
      startIndex,
    ],
    // [isTooltipVisible, getMainGraphPointsObservable, enabledGraphNames, getTooltipIndexObservable, inertStartIndex],
    function updateTooltipPositionAndTextEffect(
      isTooltipVisible,
      points,
      enabledGraphNames,
      index,
      startIndex
    ) {
      if (!isTooltipVisible) return;

      const { x } = points[enabledGraphNames[0]][index];
      tooltipLine.style.transform = `translateX(${
        (x - 1) / devicePixelRatio
      }px)`;
      const dataIndex = index + Math.floor(startIndex);
      for (let i = 0; i < enabledGraphNames.length; i++) {
        const { x, y } = points[enabledGraphNames[i]][index];
        tooltipCircles[enabledGraphNames[i]].style.transform = `translateX(${
          x / devicePixelRatio + CENTER_OFFSET
        }px) translateY(${y / devicePixelRatio + CENTER_OFFSET}px)`;
        tooltipValues[enabledGraphNames[i]].innerText = String(
          options.data[enabledGraphNames[i]][dataIndex]
        );
        // tooltipValues[enabledGraphNames[i]].innerText = getShortNumber(options.data[enabledGraphNames[i]][dataIndex])
      }
      tooltipDate.innerText = getTooltipDateText(options.domain[dataIndex]);
      // TODO: Force reflow
      tooltip.style.transform = `translateX(${
        x / devicePixelRatio - tooltip.offsetWidth / 2
      }px)`;
    }
  );

  effect(
    [mainGraphPoints, inertOpacityStateByGraphName, width, height],
    function updateMainGraphEffect(points, opacityState, width, height) {
      graphs.canvas.width = width * window.devicePixelRatio; // only needs to be run when sizes change
      graphs.canvas.height = height * window.devicePixelRatio; // only needs to be run when sizes change
      renderGraphs({
        points,
        opacityState,
        width,
        height,
        context: graphs.context,
        graphNames: options.graphNames,
        lineWidth: options.lineWidth,
        strokeStyles: options.colors,
      });
    }
  );

  const getGraphsBoundingRect = memoizeOne(function getGraphsBoundingRect() {
    return graphs.element.getBoundingClientRect();
  });

  initDragListeners();

  return { element };

  function onButtonClick(graphName: string) {
    enabledStateByGraphName.set({
      ...enabledStateByGraphName.get(),
      [graphName]: !enabledStateByGraphName.get()[graphName],
    });
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    isWheeling.set(true);
    if (wheelTimeoutId) {
      clearTimeout(wheelTimeoutId);
    }
    wheelTimeoutId = window.setTimeout(function stopWheel() {
      isWheeling.set(false);
    }, WHEEL_CLEAR_TIMEOUT);

    const angle = (Math.atan(e.deltaY / e.deltaX) * 180) / Math.PI;

    // Noise
    if (
      (Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) === 1) ||
      (Math.abs(e.deltaX) === 1 && Math.abs(e.deltaY) === 0)
    ) {
      return;
    }

    const viewBoxWidth = endIndex.get() - startIndex.get();
    const dynamicFactor = (viewBoxWidth / MIN_VIEWBOX) * WHEEL_MULTIPLIER;

    if (
      (angle < -(90 - DEVIATION_FROM_STRAIGHT_LINE_DEGREES) && angle >= -90) || // top right, bottom left
      (angle > 90 - DEVIATION_FROM_STRAIGHT_LINE_DEGREES && angle <= 90) // top left, bottom right
    ) {
      const deltaY = e.deltaY;

      if (
        deltaY < 0 &&
        endIndex.get() -
          startIndex.get() -
          2 * Math.abs(deltaY * dynamicFactor) <
          MIN_VIEWBOX
      ) {
        const center = (endIndex.get() + startIndex.get()) / 2;
        startIndex.set(
          ensureInBounds(
            center - MIN_VIEWBOX / 2,
            0,
            options.total - 1 - MIN_VIEWBOX
          )
        );
        endIndex.set(
          ensureInBounds(center + MIN_VIEWBOX / 2, MIN_VIEWBOX, options.total - 1)
        );
      } else {
        startIndex.set(
          ensureInBounds(
            startIndex.get() - deltaY * dynamicFactor,
            0,
            options.total - 1 - MIN_VIEWBOX
          )
        );
        endIndex.set(
          ensureInBounds(
            endIndex.get() + deltaY * dynamicFactor,
            startIndex.get() + MIN_VIEWBOX,
            options.total - 1
          )
        );
      }
    } else if (
      angle >= -DEVIATION_FROM_STRAIGHT_LINE_DEGREES &&
      angle <= DEVIATION_FROM_STRAIGHT_LINE_DEGREES // left, right
    ) {
      startIndex.set(
        ensureInBounds(
          startIndex.get() + e.deltaX * dynamicFactor,
          0,
          options.total - 1 - viewBoxWidth
        )
      );
      endIndex.set(
        ensureInBounds(
          startIndex.get() + viewBoxWidth,
          MIN_VIEWBOX,
          options.total - 1
        )
      );
    } else {
      // if (
      //   (angle > DEVIATION_FROM_STRAIGT_LINE_DEGREES && angle < (90 - DEVIATION_FROM_STRAIGT_LINE_DEGREES)) // top left centered, bottom right centered
      //   || (angle < -DEVIATION_FROM_STRAIGT_LINE_DEGREES && angle > -(90 - DEVIATION_FROM_STRAIGT_LINE_DEGREES)) // top right centered, bottom left centered
      // ) {
      //   if (
      //     (e.deltaX <= 0 && e.deltaY <= 0)
      //     || (e.deltaX > 0 && e.deltaY > 0)
      //   ) {
      //     left.set(keepInBounds(left.get() + e.deltaX * WHEEL_MULTIPLIER, 0, right.get() - minimalPixelsBetweenResizers))
      //   } else {
      //     right.set(keepInBounds(right.get() + e.deltaX * WHEEL_MULTIPLIER, left.get() + minimalPixelsBetweenResizers, width.get()))
      //   }
      // }
    }
  }

  function initDragListeners() {
    graphs.element.addEventListener("wheel", onWheel);

    graphs.element.addEventListener("mouseenter", function (e) {
      isHovering.set(true);
      mouseX.set(e.clientX - getGraphsBoundingRect().left);
    });
    graphs.element.addEventListener("mouseleave", function () {
      isHovering.set(false);
    });
    graphs.element.addEventListener("mousemove", function (e) {
      mouseX.set(e.clientX - getGraphsBoundingRect().left);
    });

    let prevMouseX = 0;

    const onGraphsDrag = (e: MouseEvent) => {
      const visibleIndexRange = endIndex.get() - startIndex.get();
      const newStartIndex = interpolate(
        0,
        width.get(),
        startIndex.get(),
        endIndex.get(),
        prevMouseX - getX(e)
      );

      startIndex.set(
        ensureInBounds(newStartIndex, 0, options.total - 1 - visibleIndexRange)
      );
      endIndex.set(
        ensureInBounds(startIndex.get() + visibleIndexRange, 0, options.total - 1)
      );

      prevMouseX = getX(e);
    };

    handleDrag(graphs.element, {
      onDragStart: (e: MouseEvent) => {
        isGrabbingGraphs.set(true);
        activeCursor.set(cursors.grabbing);

        prevMouseX = getX(e);
      },
      onDragEnd: () => {
        isGrabbingGraphs.set(false);
        activeCursor.set(cursors.default);

        prevMouseX = 0;
      },
      onDragMove: onGraphsDrag,
    });
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

  function createTooltip() {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";

    const tooltipDate = document.createElement("div");
    tooltipDate.style.padding = "10px 10px 0";
    tooltip.appendChild(tooltipDate);

    const tooltipLegendContainer = document.createElement("div");
    tooltipLegendContainer.className = "tooltip__legend";
    tooltip.appendChild(tooltipLegendContainer);

    const tooltipValues: { [key: string]: HTMLDivElement } = {};
    const graphInfos: { [key: string]: HTMLDivElement } = {};
    options.graphNames.forEach((graphName) => {
      const tooltipGraphInfo = document.createElement("div");
      tooltipGraphInfo.style.color = options.colors[graphName];
      tooltipGraphInfo.style.padding = "0 10px 10px";
      graphInfos[graphName] = tooltipGraphInfo;

      const tooltipValue = document.createElement("div");
      tooltipValue.style.fontWeight = "bold";
      tooltipGraphInfo.appendChild(tooltipValue);

      const graphNameElement = document.createElement("div");
      graphNameElement.innerText = graphName;
      tooltipGraphInfo.appendChild(graphNameElement);

      tooltipValues[graphName] = tooltipValue;
      tooltipLegendContainer.appendChild(tooltipGraphInfo);
    });
    return { tooltip, tooltipValues, graphInfos, tooltipDate };
  }

  function createDOM() {
    const element = document.createElement("div");
    element.style.height = "100%";
    const graphs = createGraphs({
      width: width.get(),
      height: options.height - options.overviewHeight,
      containerHeight: `calc(100% - ${options.overviewHeight}px)`,
      containerMinHeight: MIN_HEIGHT,
    });
    const overview = Overview(
      {
        startIndex,
        endIndex,
        width,
        isWheeling,
        options,
        enabledGraphNames,
        inertOpacityStateByGraphName,
      },
      context
    );
    const controls = Controls(options, onButtonClick);

    const tooltipContainer = document.createElement("div");
    const tooltipLine = document.createElement("div");
    tooltipLine.className = "tooltip-line";
    tooltipContainer.appendChild(tooltipLine);

    const tooltipCircles: { [key: string]: HTMLDivElement } = {};
    for (let i = 0; i < options.graphNames.length; i++) {
      const circle = document.createElement("div");
      circle.style.width = `${DOT_SIZE}px`;
      circle.style.height = `${DOT_SIZE}px`;
      circle.style.borderColor = options.colors[options.graphNames[i]];
      circle.className = "tooltip__dot";
      tooltipCircles[options.graphNames[i]] = circle;
      tooltipContainer.appendChild(circle);
    }

    const {
      tooltip,
      tooltipValues,
      graphInfos: tooltipGraphInfo,
      tooltipDate,
    } = createTooltip();
    tooltipContainer.appendChild(tooltip);

    graphs.element.appendChild(tooltipContainer);

    element.appendChild(graphs.element);
    element.appendChild(overview.element);
    element.appendChild(controls);

    return {
      graphs,
      element,
      overview,
      tooltip,
      tooltipLine,
      tooltipCircles,
      tooltipValues,
      tooltipGraphInfo,
      tooltipDate,
    };
  }

  function getX(event: MouseEvent) {
    return event.clientX;
  }
};
