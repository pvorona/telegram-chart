import { effect } from "@pvorona/observable";
import { renderLineSeriesWithAreaGradient } from "../renderers";
import { ChartContext, ChartOptions } from "../../types";
import { memoizeOne, ensureInBounds, handleDrag } from "../../util";
import {
  MIN_VIEWBOX,
  WHEEL_CLEAR_TIMEOUT,
  WHEEL_MULTIPLIER,
  DEVIATION_FROM_STRAIGHT_LINE_DEGREES,
  cursor,
  MIN_HEIGHT,
} from "../constants";
import { Point } from "../types";
import { createGraphs } from "../Chart/createGraphs";
import { interpolate } from "../../util/interpolatePoint";

export const Series = (
  chartOptions: ChartOptions,
  {
    width,
    mainGraphPoints,
    inertOpacityStateByGraphName,
    startIndex,
    endIndex,
    isHovering,
    isGrabbingGraphs,
    activeCursor,
    mouseX,
    isWheeling,
    canvasHeight,
  }: ChartContext
) => {
  const { element, canvas, context } = createDom();

  renderSeries(
    mainGraphPoints.get(),
    inertOpacityStateByGraphName.get(),
  );

  let wheelTimeoutId: number | undefined = undefined;

  effect(
    [width, canvasHeight],
    (width, height) => {
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;

      renderSeries(
        mainGraphPoints.get(),
        inertOpacityStateByGraphName.get(),
      );
    },
    { fireImmediately: false }
  );

  effect(
    [mainGraphPoints, inertOpacityStateByGraphName],
    (mainGraphPoints, inertOpacityStateByGraphName) => {
      context.clearRect(
        0,
        0,
        width.get() * devicePixelRatio,
        canvasHeight.get() * devicePixelRatio
      );

      renderSeries(mainGraphPoints, inertOpacityStateByGraphName);
    },
    { fireImmediately: false }
  );

  function renderSeries(
    points: { [key: string]: Point[] },
    opacityState: { [key: string]: number },
  ) {
    renderLineSeriesWithAreaGradient({
      points,
      opacityState,
      context: context,
      graphNames: chartOptions.graphNames,
      lineWidth: chartOptions.lineWidth,
      strokeStyles: chartOptions.colors,
      height: canvasHeight.get(),
      width:width.get(),
      lineJoinByName: chartOptions.lineJoin,
    });
  }

  effect(
    [canvasHeight],
    (height) => {
      element.style.height = `${height}px`;
    },
    { fireImmediately: false }
  );

  initDragListeners();

  const getGraphsBoundingRect = memoizeOne(function getGraphsBoundingRect() {
    return element.getBoundingClientRect();
  });

  return { element };

  function createDom() {
    return createGraphs({
      width: chartOptions.width,
      height: canvasHeight.get(),
      containerHeight: canvasHeight.get(),
      containerMinHeight: MIN_HEIGHT,
    });
  }

  function initDragListeners() {
    element.addEventListener("wheel", onWheel);

    element.addEventListener("mouseenter", function (e) {
      isHovering.set(true);
      mouseX.set(e.clientX - getGraphsBoundingRect().left);
    });
    element.addEventListener("mouseleave", function () {
      isHovering.set(false);
    });
    element.addEventListener("mousemove", function (e) {
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
        prevMouseX - e.clientX
      );

      startIndex.set(
        ensureInBounds(
          newStartIndex,
          0,
          chartOptions.total - 1 - visibleIndexRange
        )
      );
      endIndex.set(
        ensureInBounds(
          startIndex.get() + visibleIndexRange,
          0,
          chartOptions.total - 1
        )
      );

      prevMouseX = e.clientX;
    };

    handleDrag(element, {
      onDragStart: (e: MouseEvent) => {
        isGrabbingGraphs.set(true);
        activeCursor.set(cursor.grabbing);

        prevMouseX = e.clientX;
      },
      onDragEnd: () => {
        isGrabbingGraphs.set(false);
        activeCursor.set(cursor.default);

        prevMouseX = 0;
      },
      onDragMove: onGraphsDrag,
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
            chartOptions.total - 1 - MIN_VIEWBOX
          )
        );
        endIndex.set(
          ensureInBounds(
            center + MIN_VIEWBOX / 2,
            MIN_VIEWBOX,
            chartOptions.total - 1
          )
        );
      } else {
        startIndex.set(
          ensureInBounds(
            startIndex.get() - deltaY * dynamicFactor,
            0,
            chartOptions.total - 1 - MIN_VIEWBOX
          )
        );
        endIndex.set(
          ensureInBounds(
            endIndex.get() + deltaY * dynamicFactor,
            startIndex.get() + MIN_VIEWBOX,
            chartOptions.total - 1
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
          chartOptions.total - 1 - viewBoxWidth
        )
      );
      endIndex.set(
        ensureInBounds(
          startIndex.get() + viewBoxWidth,
          MIN_VIEWBOX,
          chartOptions.total - 1
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
};
