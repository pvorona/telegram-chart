import { BitMapPixel, CssPixel } from "../types";

export function cssToBitMap(n: CssPixel): BitMapPixel {
  return (n * devicePixelRatio) as BitMapPixel;
}
