import { BitMapSize } from "../../types";

export function line(
  context: CanvasRenderingContext2D,
  x1: BitMapSize,
  y1: BitMapSize,
  x2: BitMapSize,
  y2: BitMapSize
) {
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
}
