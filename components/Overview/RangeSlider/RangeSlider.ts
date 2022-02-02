import { effect, observable, observe } from "@pvorona/observable";
import { ChartContext, ChartOptions } from "../../../types";
import { handleDrag, ensureInBounds, areNumbersClose } from "../../../util";
import {
  cursor,
  DEVIATION_FROM_STRAIGHT_LINE_DEGREES,
  MIN_VIEWBOX,
  WHEEL_MULTIPLIER,
} from "../../constants";
import { Component } from "../../types";

import "./overview-resize-handler.css";
import "./overview-viewbox.css";

const minimalPixelsBetweenResizeHandlers = 10;

export const RangeSlider: Component<ChartOptions, ChartContext> = (
  options,
  context
) => {
  const { startIndex, endIndex, width, isDragging, activeCursor, isWheeling } =
    context;

  const {
    viewBoxElement,
    leftResizeHandler,
    rightResizeHandler,
    leftSide,
    rightSide,
  } = createDOM();

  const left = observable(
    (startIndex.get() / (options.total - 1)) * width.get()
  );

  const right = observable(
    (endIndex.get() / (options.total - 1)) * width.get()
  );

  effect([left], (left) => {
    viewBoxElement.style.left = `${left}px`;
  });

  effect([right, width], (right, width) => {
    viewBoxElement.style.right = `${width - right}px`;
  });

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

  let cursorResizeHandlerDelta = 0;

  leftSide.addEventListener("mousedown", onLeftSideClick);
  rightSide.addEventListener("mousedown", onRightSideClick);

  function onLeftSideClick(event: MouseEvent) {
    const viewBoxWidth = right.get() - left.get();
    const newLeft = ensureInBounds(
      event.clientX - viewBoxWidth / 2,
      0,
      width.get()
    );
    const newRight = newLeft + viewBoxWidth;

    left.set(newLeft);
    right.set(newRight);
  }

  function onRightSideClick(event: MouseEvent) {
    const viewBoxWidth = right.get() - left.get();
    const newRight = ensureInBounds(
      event.clientX + viewBoxWidth / 2,
      0,
      width.get()
    );
    const newLeft = newRight - viewBoxWidth;

    left.set(newLeft);
    right.set(newRight);
  }

  handleDrag(leftResizeHandler, {
    onDragStart: onLeftResizeHandlerMouseDown,
    onDragMove: onLeftResizeHandlerMouseMove,
    onDragEnd: onDragEnd,
  });
  handleDrag(rightResizeHandler, {
    onDragStart: onRightResizeHandlerMouseDown,
    onDragMove: onRightResizeHandlerMouseMove,
    onDragEnd: onDragEnd,
  });
  handleDrag(viewBoxElement, {
    onDragStart: onViewBoxElementMouseDown,
    onDragMove: onViewBoxElementMouseMove,
    onDragEnd: onViewBoxElementMouseUp,
  });

  viewBoxElement.addEventListener("wheel", onWheel);

  function onLeftResizeHandlerMouseDown(event: MouseEvent) {
    isDragging.set(true);
    activeCursor.set(cursor.resize);
    cursorResizeHandlerDelta = event.clientX - left.get();
  }

  function onDragEnd() {
    isDragging.set(false);
    activeCursor.set(cursor.default);
  }

  function onLeftResizeHandlerMouseMove(event: MouseEvent) {
    const leftVar = ensureInOverviewBounds(
      event.clientX - cursorResizeHandlerDelta
    );
    left.set(
      ensureInBounds(
        leftVar,
        0,
        right.get() - minimalPixelsBetweenResizeHandlers
      )
    );
  }

  function onRightResizeHandlerMouseDown(event: MouseEvent) {
    cursorResizeHandlerDelta = event.clientX - right.get();
    isDragging.set(true);
    activeCursor.set(cursor.resize);
  }

  function ensureInOverviewBounds(x: number) {
    return ensureInBounds(x, 0, width.get());
  }

  function onViewBoxElementMouseDown(event: MouseEvent) {
    cursorResizeHandlerDelta = event.clientX - left.get();
    isDragging.set(true);
    activeCursor.set(cursor.grabbing);
  }

  function onViewBoxElementMouseUp() {
    isDragging.set(false);
    activeCursor.set(cursor.default);
  }

  function onViewBoxElementMouseMove(event: MouseEvent) {
    const widthVar = right.get() - left.get();
    const nextLeft = event.clientX - cursorResizeHandlerDelta;
    const stateLeft = ensureInBounds(nextLeft, 0, width.get() - widthVar);
    left.set(stateLeft);
    right.set(stateLeft + widthVar);
  }

  function onRightResizeHandlerMouseMove(event: MouseEvent) {
    const rightVar = ensureInOverviewBounds(
      event.clientX - cursorResizeHandlerDelta
    );
    right.set(
      ensureInBounds(
        rightVar,
        left.get() + minimalPixelsBetweenResizeHandlers,
        rightVar
      )
    );
  }

  // Exact copy of Series#onWheel
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

  return { element: viewBoxElement };

  function createDOM() {
    const leftResizeHandler = document.createElement("div");
    leftResizeHandler.style.backgroundColor = options.overview.edgeColor;
    leftResizeHandler.className =
      "overview__resize-handler overview__resize-handler--left";
    const rightResizeHandler = document.createElement("div");
    rightResizeHandler.style.backgroundColor = options.overview.edgeColor;
    rightResizeHandler.className =
      "overview__resize-handler overview__resize-handler--right";
    const viewBoxElement = document.createElement("div");
    viewBoxElement.style.borderColor = options.overview.edgeColor;
    viewBoxElement.className = "overview__viewbox";

    const leftSide = document.createElement("div");
    leftSide.style.backgroundColor = options.overview.overlayColor;
    leftSide.className = "overview__left";
    const rightSide = document.createElement("div");
    rightSide.style.backgroundColor = options.overview.overlayColor;
    rightSide.className = "overview__right";

    viewBoxElement.appendChild(leftSide);
    viewBoxElement.appendChild(rightSide);
    viewBoxElement.appendChild(leftResizeHandler);
    viewBoxElement.appendChild(rightResizeHandler);

    return {
      viewBoxElement,
      leftResizeHandler,
      rightResizeHandler,
      leftSide,
      rightSide,
    };
  }
};
