import { ChartContext } from "./components";

export interface ChartData {
  columns: (number | string)[][];
  types: { [key: string]: string };
  colors: { [key: string]: string };
  names: { [key: string]: string };
}

export interface VisibilityState {
  [key: string]: boolean;
}

export interface Data {
  [key: string]: number[];
}

const kind = Symbol("kind");

type Nominal<Source, Label extends string> = Source & { [kind]: Label };

export type CssPixel = Nominal<number, "CssPixel">;
export type BitPixel = Nominal<number, "BitPixel">;

// export function cssToBitMap(n: CssPixels): BitMapSize {
//   return (n * devicePixelRatio) as BitMapSize;
// }

export interface ChartOptions {
  x: {
    color: string;
    ticks: number;
    tick: {
      height: number;
      margin: number;
    };
    label: {
      fontSize: number;
      fontFamily: string;
    };
    marginBottom: number;
    marginTop: number;
  };
  y: {
    color: string;
    ticks: number;
    label: {
      fontSize: number;
      fontFamily: string;
    };
  };
  domain: number[];
  graphNames: string[];
  width: number;
  height: number;
  lineWidth: number;
  overview: {
    height: number;
    lineWidth: number;
    overlayColor: string;
    edgeColor: string;
  };
  colors: { [key: string]: string };
  data: Data;
  lineJoin: {
    [series: string]: CanvasLineJoin;
  };
  total: number;
  visibilityState: VisibilityState;
  viewBox: {
    startIndex: number;
    endIndex: number;
  };
  tooltip: {
    lineColor: string;
    backgroundColor: string;
    color: string;
  };
}

export type ChartContext = ReturnType<typeof ChartContext>;
