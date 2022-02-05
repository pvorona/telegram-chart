import { BitMapPixel, CSSPixel } from "../types";

export function cssToBitMap(n: CSSPixel): BitMapPixel {
  return (n * devicePixelRatio) as BitMapPixel;
}
