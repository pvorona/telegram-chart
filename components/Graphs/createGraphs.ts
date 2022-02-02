import "./Graphs.css";

export function createGraphs({
  width,
  height,
  containerHeight,
  containerMinHeight,
}: {
  width: number;
  height: number;
  containerHeight?: number;
  containerMinHeight?: number;
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
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  element.appendChild(canvas);

  return { element, context, canvas };
}
