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
  xAxisMarginBottom:number
  domain: number[];
  xAxisHeight: number;
  graphNames: string[];
  width: number;
  height: number;
  lineWidth: number;
  overviewHeight: number;
  overviewWidth: number;
  OVERVIEW_LINE_WIDTH: number;
  colors: { [key: string]: string };
  data: Data;
  total: number;
  visibilityState: VisibilityState;
  viewBox: {
    startIndex: number;
    endIndex: number;
  };
}

export type ChartContext = ReturnType<typeof ChartContext>;
