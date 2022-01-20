import {
  // animationObservable,
  computeLazy,
  effect,
  // transition,
} from "@pvorona/observable";
// import { linear } from "../../easings";
import { ChartContext, ChartOptions } from "../../types";
import { createCache } from "../../util/createCache";
// import { FAST_TRANSITIONS_TIME } from "../constants";
// import { calculateLogScaleMultiplier } from "../../util";
// import { interpolate } from "../../util/interpolatePoint";
import { Component, Point } from "../types";

// - [x] config
// - [x] Changing window size does not changes canvas size
// - [x] Re-rendering when view box does not change (toggle graphs) | State machine?
// - [x] Dates cache
// - [x] Ticks
// - [ ] Ticks should overlap main canvas
// - [x] First and last labels can be clipped
// - [ ] Compute precise label clipping
// - [ ] Highlight tick when hovering point around it
// - [ ] Animation when changing step size
//       Inert Observable Factor
//       opacity -> progress between int factors
//       animating multiple factor groups?
// - [-] Starting not from 0
// - [ ] Calculating factor with loop

export const XAxis: Component<ChartOptions, ChartContext> = (
  options,
  { mainGraphPoints, inertStartIndex, inertEndIndex, width }
) => {
  const labelsCache = createCache(createLabel);

  const {
    graphNames,
    domain,
    x: {
      color,
      marginBottom,
      tick: { height: tickHeight, margin: tickMargin },
      label: { fontSize, fontFamily, width: labelWidth },
    },
  } = options;
  const height = fontSize + tickHeight + tickMargin + marginBottom;
  const { element, context, canvas } = createDOM({
    height,
    marginBottom,
  });
  const factor = computeLazy(
    [inertStartIndex, inertEndIndex],
    (inertStartIndex, inertEndIndex) =>
      computeScaleFactor(inertEndIndex - inertStartIndex)
  );

  // const inertFactor = animationObservable(
  //   factor,
  //   transition(factor.get(), FAST_TRANSITIONS_TIME, linear)
  // );

  effect([width], (width) => {
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    context.fillStyle = color;
    context.font = `${fontSize * devicePixelRatio}px ${fontFamily}`;
    context.textBaseline = "top";
    context.textAlign = "center";
    context.strokeStyle = color;

    updateXLabels(inertStartIndex.get(), mainGraphPoints.get(), factor.get());
  });

  function updateXLabels(
    inertStartIndex: number,
    mainGraphPoints: { [key: string]: Point[] },
    factor: number
  ) {
    // const factor = calculateLogScaleMultiplier(endIndex - startIndex);
    const points = mainGraphPoints[graphNames[0]];

    context.beginPath();
    for (
      let currentRealIndex =
        Math.floor(inertStartIndex) +
        factor -
        (Math.floor(inertStartIndex) % factor);
      currentRealIndex < Math.floor(inertStartIndex) + points.length;
      currentRealIndex += factor
    ) {
      const pointIndex = currentRealIndex - Math.floor(inertStartIndex);
      const { x } = points[pointIndex];

      if (x < labelWidth) continue;
      if (width.get() * devicePixelRatio - x < labelWidth) continue;

      const label = labelsCache.get(domain[currentRealIndex]);

      context.moveTo(x, 0);
      context.lineTo(x, tickHeight * devicePixelRatio);
      context.fillText(
        label,
        x,
        tickHeight * devicePixelRatio + tickMargin * devicePixelRatio
      );
    }
    context.stroke();
  }

  effect([inertStartIndex, factor], (inertStartIndex, factor) => {
    context.clearRect(
      0,
      0,
      width.get() * devicePixelRatio,
      height * devicePixelRatio
    );

    updateXLabels(inertStartIndex, mainGraphPoints.get(), factor);
  });

  return { element };
};

function computeScaleFactor(number: number) {
  let factor = 1;
  while (true) {
    if (number / factor <= 8) {
      break;
    }
    factor *= 2;
  }
  return factor;
}

function createDOM({
  height,
  marginBottom,
}: {
  height: number;
  marginBottom: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.style.marginBottom = `${marginBottom}px`;
  canvas.style.width = `100%`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  return { element: canvas, canvas, context };
}

const createLabel = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
};
