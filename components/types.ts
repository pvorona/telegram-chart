import { CssPixel } from "../types";

export interface EnabledGraphNames {
  [key: string]: boolean;
}

export interface OpacityState {
  [key: string]: number;
}

export interface Point {
  x: CssPixel;
  y: CssPixel;
}

export type Component<Props, Context> = (
  p: Props,
  c: Context
) => { element: HTMLElement };
