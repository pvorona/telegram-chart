import {
  // computeLazy,
  effect,
} from "@pvorona/observable";
import { ChartContext, ChartOptions } from "../../types";

export const YAxis = (
  options: ChartOptions,
  { width, canvasHeight: height, visibleMin, visibleMax }: ChartContext
) => {
  const { element, context } = createDOM(
    width.get(),
    height.get(),
    options.y.color
  );

  // const factor = computeLazy(
  //   [visibleMin, visibleMax],
  //   (visibleMin, visibleMax) => computeScaleFactor(visibleMin - visibleMax)
  // );

  // const TOTAL_STEPS = 1000
  
  effect(
    [height, width, visibleMin, visibleMax],
    (height, width, visibleMin, visibleMax) => {
      // const valueRange = overallMax - overallMin;

      const yStep = (visibleMax - visibleMin) / options.y.ticks;

      context.clearRect(
        0,
        0,
        width * devicePixelRatio,
        height * devicePixelRatio
      );
      context.beginPath();

      // for (
      //   let currentRealIndex =
      //     Math.floor(inertStartIndex) +
      //     factor -
      //     (Math.floor(inertStartIndex) % factor);
      //   currentRealIndex < Math.floor(inertStartIndex) + points.length;
      //   currentRealIndex += factor
      // ) {
      // }

      for (let i = 1; i <= options.y.ticks; i++) {
        context.moveTo(0, yStep * i * devicePixelRatio);
        context.lineTo(width * devicePixelRatio, yStep * i * devicePixelRatio);
      }
      context.stroke();
    }
  );

  return { element };
};

function createDOM(width: number, height: number, color: string) {
  const element = document.createElement("canvas");
  const context = element.getContext("2d");

  if (!context) throw Error("Cannot acquire context");

  element.style.height = `${height}px`;
  element.style.position = "absolute";
  element.style.width = `100%`;
  element.style.height = `100%`;
  element.width = width * devicePixelRatio;
  element.height = height * devicePixelRatio;

  context.strokeStyle = color;

  return { element, context };
}

// function computeScaleFactor(number: number) {
//   let factor = 1;
//   while (true) {
//     if (number / factor <= 8) {
//       break;
//     }
//     factor *= 2;
//   }
//   return factor;
// }
