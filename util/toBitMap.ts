import { BitMapSize } from "../types";

export function toBitMapSize(n: number): BitMapSize {
  return (n * devicePixelRatio) as BitMapSize;
}
