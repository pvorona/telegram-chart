import { effect, Gettable, Observable } from "@pvorona/observable";
import { ChartContext } from "../../types";
// import { calculateLogScaleMultiplier } from "../../util";
// import { interpolate } from "../../util/interpolatePoint";
import { Component } from "../types";

// - [ ] Changing window size does not changes canvas size
// - [ ] Re-rendering when viewbox does not change (toggle graphs)
// - [-] Starting not from 0
// - [ ] Calculating factor with loop

const color = "#afb3b1";
const fontsize = 12;
const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, Roboto, Helvetica, Verdana, sans-serif";

export const XAxis: Component<
  {
    width: Observable<number> & Gettable<number>;
    graphNames: string[];
    totalPoints: number;
    domain: number[];
    height: number;
    marginBottom:number;
  },
  ChartContext
> = (
  { width, graphNames, domain, height,marginBottom },
  { mainGraphPoints, inertStartIndex, inertEndIndex }
) => {
  const { element, context } = createDOM({
    width: width.get(),
    height: height,
    marginBottom,
  });

  effect(
    [inertStartIndex, inertEndIndex, mainGraphPoints, width],
    (inertStartIndex, inertEndIndex, mainGraphPoints, width) => {
      context.clearRect(
        0,
        0,
        width * devicePixelRatio,
        height * devicePixelRatio
      );
      // canvas.width = width * devicePixelRatio; // only needs to be run when sizes change
      // canvas.height = H * devicePixelRatio; // only needs to be run when sizes change

      const factor = computeScaleFactor(inertEndIndex - inertStartIndex);
      // const factor = calculateLogScaleMultiplier(endIndex - startIndex);
      const points = mainGraphPoints[graphNames[0]];

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

        const date = new Date(domain[currentRealIndex]);
        const label = `${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

        context.fillText(label, x, 0);
      }
    }
  );

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

function createDOM({ width, height,marginBottom }: { width: number; height: number,marginBottom:number }) {
  const canvas = document.createElement("canvas");
  canvas.style.marginBottom = `${marginBottom}px`;
  canvas.style.width = `100%`;
  canvas.style.height = `${height}px`;
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  context.fillStyle = color;
  context.font = `${fontsize * devicePixelRatio}px ${FONT_FAMILY}`;
  context.textBaseline = "top";
  context.textAlign = "center";

  return { element: canvas, canvas, context };
}
