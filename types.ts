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

export type XOptions = {
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

export type XOptionsValidated = {
  color: Color;
  ticks: number;
  tick: {
    height: number; // positive?
    margin: number; // positive?
  };
  label: {
    fontSize: number;
    fontFamily: string;
  };
  marginBottom: number;
  marginTop: number;
};

export type YOptions = {
  color: string;
  ticks: number;
  label: {
    fontSize: number;
    fontFamily: string;
  };
};

export type YOptionsValidated = {
  color: Color;
  ticks: number;
  label: {
    fontSize: number;
    fontFamily: string;
  };
};

export type OverviewOptions = {
  height: number;
  lineWidth: number;
  overlayColor: string;
  edgeColor: string;
};

export type OverviewOptionsValidated = {
  height: number; // positive
  lineWidth: number;
  overlayColor: Color;
  edgeColor: Color;
};

export type TooltipOptions = {
  lineColor: string;
  backgroundColor: string;
  color: string;
};

export type TooltipOptionsValidated = {
  lineColor: Color;
  backgroundColor: Color;
  color: Color;
};

export type ViewBoxOptions = {
  startIndex: number;
  endIndex: number;
};

export type ViewBoxOptionsValidated = {
  startIndex: number;
  endIndex: number;
};

export type ColorsOptions = { [key: string]: string };

export type ColorsOptionsValidated = { [key: string]: Color };

export type LineJoinOptions = {
  [series: string]: CanvasLineJoin;
};

export type ChartOptions = Readonly<{
  x: XOptionsValidated;
  y: YOptionsValidated;
  overview: OverviewOptionsValidated;
  tooltip: TooltipOptionsValidated;
  viewBox: ViewBoxOptionsValidated;
  visibility: VisibilityState;
  total: number;
  width: number;
  height: number;
  lineWidth: number;
  colors: ColorsOptionsValidated;

  data: Data;
  lineJoin: LineJoinOptions;
  domain: number[];
  graphNames: string[];
}>;

export type UncheckedChartOptions = Readonly<{
  x: XOptions;
  y: YOptions;
  overview: OverviewOptions;
  tooltip: TooltipOptions;
  viewBox: ViewBoxOptions;
  visibility: VisibilityState;
  total: number;
  width: number;
  height: number;
  lineWidth: number;
  colors: ColorsOptions;
  data: Data;
  lineJoin: LineJoinOptions;

  domain: number[];
  graphNames: string[];
}>;

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

export type Nominal<Source, Label extends string> = Source & {
  __kind__: Label;
};

export type BitMapSize = Nominal<number, "BitMapSize">;
export type Color = Nominal<string, "Color">;

export type ChartContext = ReturnType<typeof ChartContext>;
