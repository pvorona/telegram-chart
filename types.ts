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
  lineJoin: {
    [series: string]: CanvasLineJoin;
  };
}

// type Series = {
//   title?: string
//   series?: number[]
//   color?: string
//   isVisible?: boolean
// }

// const graphs = [{
//   title: 'A',
//   data: [1, 2],
//   color: 'red',
//   visible: true,
// }]

// type LineWidth = 1 | 2 | 3 | 4;
// type LineStyle = 'solid' | 'dashed'

// type Series = {
//   // title?: string;
//   // axisLabelVisible
//   data?: number[];
//   color?: string;
//   // Are series visible on initial render
//   // Default: true
//   visible?: boolean;
//   lineJoin: CanvasLineJoin;
//   lineWidth: LineWidth;
//   lineStyle?: LineStyle
// };

export type ChartContext = ReturnType<typeof ChartContext>;
