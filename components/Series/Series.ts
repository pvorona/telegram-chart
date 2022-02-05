import { effect } from "@pvorona/observable";
import {
  clearRect,
  renderLineSeriesWithAreaGradient,
  setCanvasSize,
} from "../renderers";
import {
  ChartContext,
  ChartOptionsValidated,
  NonNegativeNumber,
} from "../../types";
import {
  ensureInBounds,
  handleDrag,
  interpolate,
  cssToBitMap,
} from "../../util";
import {
  MIN_VIEWBOX,
  WHEEL_MULTIPLIER,
  DEVIATION_FROM_STRAIGHT_LINE_DEGREES,
  cursor,
  MIN_HEIGHT,
} from "../constants";
import { Component, Point } from "../types";
import { createGraphs } from "../Graphs/createGraphs";
import { validateNonNegativeNumber } from "../../config/validateNonNegativeNumber";
import { validateCssPixel } from "../../config/validateCssPixel";

export const Series: Component<ChartOptionsValidated, ChartContext> = (
  options,
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
  }
) => {
  const { element, canvas, context } = createDOM();

  renderSeries(mainGraphPoints.get(), inertOpacityStateByGraphName.get());

  effect(
    [width, canvasHeight],
    (width, height) => {
      setCanvasSize(canvas, cssToBitMap(width), cssToBitMap(height));
      renderSeries(mainGraphPoints.get(), inertOpacityStateByGraphName.get());
    },
    { fireImmediately: false }
  );

  effect(
    [mainGraphPoints, inertOpacityStateByGraphName],
    (mainGraphPoints, inertOpacityStateByGraphName) => {
      clearRect(
        context,
        cssToBitMap(width.get()),
        cssToBitMap(canvasHeight.get())
      );
      renderSeries(mainGraphPoints, inertOpacityStateByGraphName);
    },
    { fireImmediately: false }
  );

  function renderSeries(
    points: { [key: string]: Point[] },
    opacityState: { [key: string]: number }
  ) {
    renderLineSeriesWithAreaGradient({
      points,
      opacityState,
      context: context,
      graphNames: options.graphNames,
      lineWidth: options.lineWidth,
      strokeStyles: options.colors,
      height: canvasHeight.get(),
      width: width.get(),
      lineJoinByName: options.lineJoin,
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

  return { element };

  function createDOM() {
    return createGraphs({
      width: options.width,
      height: canvasHeight.get(),
      containerHeight: canvasHeight.get(),
      containerMinHeight: MIN_HEIGHT,
    });
  }

  function initDragListeners() {
    element.addEventListener("wheel", onWheel);

    element.addEventListener("mouseenter", function (e) {
      isHovering.set(true);
      mouseX.set(validateCssPixel(e.clientX));
    });
    element.addEventListener("mouseleave", function () {
      isHovering.set(false);
    });
    element.addEventListener("mousemove", function (e) {
      mouseX.set(validateCssPixel(e.clientX));
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
          0 as NonNegativeNumber,
          (options.total - 1 - visibleIndexRange) as NonNegativeNumber
        )
      );
      endIndex.set(
        validateNonNegativeNumber(
          ensureInBounds(
            startIndex.get() + visibleIndexRange,
            0 as NonNegativeNumber,
            options.total - 1
          )
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
          validateNonNegativeNumber(
            ensureInBounds(
              center - MIN_VIEWBOX / 2,
              0,
              options.total - 1 - MIN_VIEWBOX
            )
          )
        );
        endIndex.set(
          validateNonNegativeNumber(
            ensureInBounds(
              center + MIN_VIEWBOX / 2,
              MIN_VIEWBOX,
              options.total - 1
            )
          )
        );
      } else {
        startIndex.set(
          validateNonNegativeNumber(
            ensureInBounds(
              startIndex.get() - deltaY * dynamicFactor,
              0,
              options.total - 1 - MIN_VIEWBOX
            )
          )
        );
        endIndex.set(
          validateNonNegativeNumber(
            ensureInBounds(
              endIndex.get() + deltaY * dynamicFactor,
              startIndex.get() + MIN_VIEWBOX,
              options.total - 1
            )
          )
        );
      }
    } else if (
      angle >= -DEVIATION_FROM_STRAIGHT_LINE_DEGREES &&
      angle <= DEVIATION_FROM_STRAIGHT_LINE_DEGREES // left, right
    ) {
      startIndex.set(
        validateNonNegativeNumber(
          ensureInBounds(
            startIndex.get() + e.deltaX * dynamicFactor,
            0,
            options.total - 1 - viewBoxWidth
          )
        )
      );
      endIndex.set(
        validateNonNegativeNumber(
          ensureInBounds(
            startIndex.get() + viewBoxWidth,
            MIN_VIEWBOX,
            options.total - 1
          )
        )
      );
    }
  }
};
