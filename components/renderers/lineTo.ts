import { BitMapSize } from "../../types";

export function lineTo(
  context: CanvasRenderingContext2D,
  x: BitMapSize,
  y: BitMapSize
) {
  context.lineTo(x, y);
}
