import {
  compute,
  // computeLazy,
  effect,
} from "@pvorona/observable";
import { BitMapSize, ChartContext, ChartOptions } from "../../types";
import {
  getClosestGreaterOrEqualDivisibleInt,
  interpolate,
  toBitMapSize,
} from "../../util";
import { clearRect, line, setCanvasSize } from "../renderers";

export const YAxis = (
  options: ChartOptions,
  {
    width,
    canvasHeight: height,
    inertVisibleMin,
    inertVisibleMax,
  }: ChartContext
) => {
  const { element, context } = createDOM(
    width.get(),
    height.get(),
    options.y.color
  );

  const factor = compute(
    [inertVisibleMin, inertVisibleMax],
    (inertVisibleMin, inertVisibleMax) => {
      const yRange = inertVisibleMax - inertVisibleMin;

      return computeScaleFactor(yRange, options.y.ticks);
    }
  );

  renderLabelsAndGrid(
    inertVisibleMin.get(),
    inertVisibleMax.get(),
    factor.get(),
    width.get(),
    height.get()
  );

  effect(
    [width, height],
    (width, height) => {
      setCanvasSize(element, toBitMapSize(width), toBitMapSize(height));
      setCanvasStyle(
        context,
        options.y.label.color,
        options.y.color,
        options.y.label.fontSize,
        options.y.label.fontFamily
      );
      renderLabelsAndGrid(
        inertVisibleMin.get(),
        inertVisibleMax.get(),
        factor.get(),
        width,
        height
      );
    },
    { fireImmediately: false }
  );

  effect(
    [inertVisibleMin, inertVisibleMax, factor],
    (inertVisibleMin, inertVisibleMax, factor) => {
      clearRect(context, toBitMapSize(width.get()), toBitMapSize(height.get()));
      renderLabelsAndGrid(
        inertVisibleMin,
        inertVisibleMax,
        factor,
        width.get(),
        height.get()
      );
    },
    { fireImmediately: false }
  );

  return { element };

  function renderLabelsAndGrid(
    inertVisibleMin: number,
    inertVisibleMax: number,
    factor: number,
    width: number,
    height: number
  ) {
    context.beginPath();
    for (
      let i = getClosestGreaterOrEqualDivisibleInt(inertVisibleMin, factor);
      i <= inertVisibleMax;
      i += factor
    ) {
      const screenY = toBitMapSize(
        interpolate(inertVisibleMin, inertVisibleMax, height, 0, i)
      );
      const x1 = 0 as BitMapSize;
      const y1 = screenY;
      const x2 = toBitMapSize(width);
      const y2 = screenY;
      const textY = screenY - toBitMapSize(options.y.label.marginBottom);
      const label = `${i}`;

      if (textY - toBitMapSize(options.y.label.fontSize) < 0) continue;

      context.fillText(label, toBitMapSize(options.y.label.marginLeft), textY);
      line(context, x1, y1, x2, y2);
    }
    context.stroke();
  }

  function createDOM(width: number, height: number, color: string) {
    const element = document.createElement("canvas");
    const context = element.getContext("2d");

    if (!context) throw Error("Cannot acquire context");

    element.style.height = `${height}px`;
    element.style.position = "absolute";
    element.style.width = `100%`;
    element.style.pointerEvents = "none";
    setCanvasSize(element, toBitMapSize(width), toBitMapSize(height));
    setCanvasStyle(
      context,
      options.y.label.color,
      options.y.color,
      options.y.label.fontSize,
      options.y.label.fontFamily
    );

    context.strokeStyle = color;

    return { element, context };
  }

  function setCanvasStyle(
    context: CanvasRenderingContext2D,
    fillColor: string,
    strokeColor: string,
    fontSize: number,
    fontFamily: string
  ) {
    context.fillStyle = fillColor;
    context.font = `${toBitMapSize(fontSize)}px ${fontFamily}`;
    context.textBaseline = "bottom";
    context.textAlign = "left";
    context.strokeStyle = strokeColor;
  }
};

const PREFERRED_FACTORS = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000,
];

function computeScaleFactor(number: number, ticks: number) {
  let factorIndex = -1;
  while (true) {
    if (number / PREFERRED_FACTORS[factorIndex] <= ticks) {
      break;
    }
    factorIndex++;
  }
  return PREFERRED_FACTORS[factorIndex];
}
