import { BitMapSize } from "../../types";

export function setCanvasSize(
  canvas: HTMLCanvasElement,
  width: BitMapSize,
  height: BitMapSize
) {
  canvas.width = width;
  canvas.height = height;
}
