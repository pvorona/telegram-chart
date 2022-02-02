import { CssPixel } from "../../types";
import { cssToBitMap } from "../../util/cssToBitMap";
import "./Graphs.css";

export function createGraphs({
  width,
  height,
  containerHeight,
  containerMinHeight,
}: {
  width: CssPixel;
  height: CssPixel;
  containerHeight?: CssPixel;
  containerMinHeight?: CssPixel;
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
  canvas.width = cssToBitMap(width);
  canvas.height = cssToBitMap(height);
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  element.appendChild(canvas);

  return { element, context, canvas };
}
