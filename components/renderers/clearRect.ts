import { BitMapPixel } from "../../types";

export function clearRect(
  context: CanvasRenderingContext2D,
  width: BitMapPixel,
  height: BitMapPixel
) {
  context.clearRect(0, 0, width, height);
}
