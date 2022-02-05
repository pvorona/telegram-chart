import { CSSPixel } from "../../types";
import { cssToBitMap } from "../../util";
import { setCanvasSize } from "../renderers";
import "./Graphs.css";

export function createGraphs({
  width,
  height,
  containerHeight,
  containerMinHeight,
}: {
  width: CSSPixel;
  height: CSSPixel;
  containerHeight?: CSSPixel;
  containerMinHeight?: CSSPixel;
}) {
  const containerClassName = "graphs";
  const element = document.createElement("div");
  element.style.height = containerHeight
    ? `${containerHeight}px`
    : `${height}px`;
  if (containerMinHeight) element.style.minHeight = `${containerMinHeight}px`;
  element.className = containerClassName;
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.width = `100%`;
  canvas.style.height = `100%`;
  setCanvasSize(canvas, cssToBitMap(width), cssToBitMap(height));
  const context = canvas.getContext("2d");
  element.appendChild(canvas);

  if (context === null) {
    throw new Error("Failed to acquire canvas context");
  }

  return { element, context, canvas };
}
