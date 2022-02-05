import { BitMapSize } from "../../types";

export function clearRect(
  context: CanvasRenderingContext2D,
  width: BitMapSize,
  height: BitMapSize
) {
  context.clearRect(0, 0, width, height);
}
