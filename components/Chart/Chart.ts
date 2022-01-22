import { effect } from "@pvorona/observable";
import { renderGraphs } from "../Graphs";
import { Controls } from "../Controls";
import { ChartContext, ChartOptions } from "../../types";
import { memoizeOne, ensureInBounds, handleDrag } from "../../util";
import {
  MIN_VIEWBOX,
  MIN_HEIGHT,
  WHEEL_CLEAR_TIMEOUT,
  WHEEL_MULTIPLIER,
  DEVIATION_FROM_STRAIGHT_LINE_DEGREES,
  cursors,
} from "../constants";
import { Component, Point } from "../types";
import { createGraphs } from "./createGraphs";
import { Overview } from "../Overview";
import { interpolate } from "../../util/interpolatePoint";
import { XAxis } from "../XAxis";
// import { YAxis } from "../YAxisV2";
import { Tooltip } from "../Tooltip";

export const Chart: Component<ChartOptions, ChartContext> = (
  options,
  context
) => {
  const {
    isHovering,
    mainGraphPoints,
    inertOpacityStateByGraphName,
    isWheeling,
    isGrabbingGraphs,
    activeCursor,
    enabledGraphNames,
    startIndex,
    endIndex,
    mouseX,
    width,
    height,
  } = context;

  let wheelTimeoutId: number | undefined = undefined;

  const { element, graphs } = createDOM();

  function computeChartHeight() {
    return Math.max(
      element.offsetHeight -
        options.overview.height -
        options.x.label.fontSize -
        options.x.tick.height -
        options.x.marginBottom -
        options.x.marginBottom,
      MIN_HEIGHT
    );
  }

  window.addEventListener("resize", function resizeListener() {
    width.set(element.offsetWidth);
    height.set(computeChartHeight());
  });

  effect([width, height], (width, height) => {
    graphs.canvas.width = width * window.devicePixelRatio;
    graphs.canvas.height = height * window.devicePixelRatio;

    updateMainGraphEffect(
      mainGraphPoints.get(),
      inertOpacityStateByGraphName.get()
    );
  });

  effect(
    [mainGraphPoints, inertOpacityStateByGraphName],
    (mainGraphPoints, inertOpacityStateByGraphName) => {
      graphs.context.clearRect(
        0,
        0,
        width.get() * devicePixelRatio,
        height.get() * devicePixelRatio
      );

      updateMainGraphEffect(mainGraphPoints, inertOpacityStateByGraphName);
    }
  );

  function updateMainGraphEffect(
    points: { [key: string]: Point[] },
    opacityState: { [key: string]: number }
  ) {
    renderGraphs({
      points,
      opacityState,
      context: graphs.context,
      graphNames: options.graphNames,
      lineWidth: options.lineWidth,
      strokeStyles: options.colors,
    });
  }

  effect([height], (height) => {
    graphs.element.style.height = `${height}px`;
  });

  const getGraphsBoundingRect = memoizeOne(function getGraphsBoundingRect() {
    return graphs.element.getBoundingClientRect();
  });

  initDragListeners();

  return { element };

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
          ensureInBounds(
            center + MIN_VIEWBOX / 2,
            MIN_VIEWBOX,
            options.total - 1
          )
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
        ensureInBounds(
          startIndex.get() + visibleIndexRange,
          0,
          options.total - 1
        )
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

  function createDOM() {
    const element = document.createElement("div");
    element.style.height = "100%";
    const graphs = createGraphs({
      width: width.get(),
      height:
        options.height -
        options.overview.height -
        options.x.label.fontSize -
        options.x.tick.height -
        options.x.marginBottom -
        options.x.marginBottom,
      containerHeight:
        options.height -
        options.overview.height -
        options.x.label.fontSize -
        options.x.tick.height -
        options.x.marginBottom -
        options.x.marginBottom,
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
    const controls = Controls(options, context);
    const tooltip = Tooltip(options, context);
    const xAxis = XAxis(options, context);
    // const yAxis = YAxis(options, context);

    graphs.element.appendChild(tooltip.element);
    // graphs.element.appendChild(yAxis.element);
    element.appendChild(graphs.element);
    element.appendChild(xAxis.element);
    element.appendChild(overview.element);
    element.appendChild(controls.element);

    return {
      graphs,
      element,
    };
  }

  function getX(event: MouseEvent) {
    return event.clientX;
  }
};
