import { BitMapPixel } from "../../types";

export function setCanvasSize(
  canvas: HTMLCanvasElement,
  width: BitMapPixel,
  height: BitMapPixel
) {
  canvas.width = width;
  canvas.height = height;
}
