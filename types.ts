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
}

export type ChartContext = ReturnType<typeof ChartContext>;
