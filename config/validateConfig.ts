import {
  UncheckedChartOptions,
  ChartOptions,
  ColorsOptions,
  ColorsOptionsValidated,
  OverviewOptions,
  OverviewOptionsValidated,
  TooltipOptions,
  TooltipOptionsValidated,
  ViewBoxOptions,
  ViewBoxOptionsValidated,
  XOptions,
  XOptionsValidated,
  YOptions,
  YOptionsValidated,
} from "../types";
import { assertColor } from "./assertColor";
import { assertNonNegativeNumber } from "./assertNonNegativeNumber";
import { assertNonNegativeInt } from "./assertNonNegativeInt";

export function validateConfig(options: UncheckedChartOptions): ChartOptions {
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

export function validateXOptions(options: XOptions): XOptionsValidated {
  return {
    color: assertColor(options.color),
    ticks: assertNonNegativeInt(options.ticks),
    tick: {
      height: assertNonNegativeNumber(options.tick.height), // positive?
      margin: assertNonNegativeNumber(options.tick.margin), // positive?
    },
    label: {
      fontSize: assertNonNegativeNumber(options.label.fontSize),
      fontFamily: options.label.fontFamily,
    },
    marginBottom: assertNonNegativeNumber(options.marginBottom),
    marginTop: assertNonNegativeNumber(options.marginTop),
  };
}

export function validateYOptions(options: YOptions): YOptionsValidated {
  return {
    color: assertColor(options.color),
    ticks: assertNonNegativeInt(options.ticks),
    label: {
      fontSize: assertNonNegativeNumber(options.label.fontSize),
      fontFamily: options.label.fontFamily,
    },
  };
}

export function validateOverviewOptions(
  options: OverviewOptions
): OverviewOptionsValidated {
  return {
    height: assertNonNegativeNumber(options.height),
    lineWidth: assertNonNegativeInt(options.lineWidth),
    overlayColor: assertColor(options.overlayColor),
    edgeColor: assertColor(options.edgeColor),
  };
}

export function validateTooltipOptions(
  options: TooltipOptions
): TooltipOptionsValidated {
  return {
    lineColor: assertColor(options.lineColor),
    backgroundColor: assertColor(options.backgroundColor),
    color: assertColor(options.color),
  };
}

export function validateViewBoxOptions(
  options: ViewBoxOptions
): ViewBoxOptionsValidated {
  return {
    startIndex: assertNonNegativeNumber(options.startIndex),
    endIndex: assertNonNegativeNumber(options.endIndex),
  };
}

export function validateColorsOptions(
  options: ColorsOptions
): ColorsOptionsValidated {
  const result = {} as ColorsOptionsValidated;

  for (const graphName in options) {
    result[graphName] = assertColor(options[graphName]);
  }

  return result;
}
