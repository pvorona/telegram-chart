import {
  ChartOptions,
  ColorsOptions,
  OverviewOptions,
  TooltipOptions,
  ViewBoxOptions,
  XOptions,
  YOptions,
} from "../types";
import { assertColor } from "./assertColor";
import { assertNonNegativeNumber } from "./assertNonNegativeNumber";
import { assertNonNegativeInt } from "./assertNonNegativeInt";

export function validateConfig(options: ChartOptions): ChartOptions {
  return {
    x: validateXOptions(options.x),
    y: validateYOptions(options.y),
    overview: validateOverviewOptions(options.overview),
    tooltip: validateTooltipOptions(options.tooltip),
    viewBox: validateViewBoxOptions(options.viewBox),
    visibility: options.visibility,
    total: assertNonNegativeInt(options.total),
    width: assertNonNegativeNumber(options.width),
    height: assertNonNegativeNumber(options.height),
    lineWidth: assertNonNegativeInt(options.lineWidth),
    colors: validateColorsOptions(options.colors),
    data: options.data,
    lineJoin: options.lineJoin,
    domain: options.domain,
    graphNames: options.graphNames,
  };
}

export function validateXOptions(options: XOptions): XOptions {
  return {
    color: assertColor(options.color),
    ticks: assertNonNegativeInt(options.ticks),
    tick: {
      height: assertNonNegativeNumber(options.tick.height),
      margin: assertNonNegativeNumber(options.tick.margin),
    },
    label: {
      fontSize: assertNonNegativeNumber(options.label.fontSize),
      fontFamily: options.label.fontFamily,
    },
    marginBottom: assertNonNegativeNumber(options.marginBottom),
    marginTop: assertNonNegativeNumber(options.marginTop),
  };
}

export function validateYOptions(options: YOptions): YOptions {
  return {
    color: assertColor(options.color),
    ticks: assertNonNegativeInt(options.ticks),
    label: {
      color: assertColor(options.label.color),
      fontSize: assertNonNegativeNumber(options.label.fontSize),
      fontFamily: options.label.fontFamily,
      marginBottom: options.label.marginBottom,
      marginLeft: options.label.marginLeft,
    },
  };
}

export function validateOverviewOptions(
  options: OverviewOptions
): OverviewOptions {
  return {
    height: assertNonNegativeNumber(options.height),
    lineWidth: assertNonNegativeInt(options.lineWidth),
    overlayColor: assertColor(options.overlayColor),
    edgeColor: assertColor(options.edgeColor),
  };
}

export function validateTooltipOptions(
  options: TooltipOptions
): TooltipOptions {
  return {
    lineColor: assertColor(options.lineColor),
    backgroundColor: assertColor(options.backgroundColor),
    color: assertColor(options.color),
  };
}

export function validateViewBoxOptions(
  options: ViewBoxOptions
): ViewBoxOptions {
  return {
    startIndex: assertNonNegativeNumber(options.startIndex),
    endIndex: assertNonNegativeNumber(options.endIndex),
  };
}

export function validateColorsOptions(options: ColorsOptions): ColorsOptions {
  const result = {} as ColorsOptions;

  for (const graphName in options) {
    result[graphName] = assertColor(options[graphName]);
  }

  return result;
}
