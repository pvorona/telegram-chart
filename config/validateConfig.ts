import {
  ChartOptions,
  ChartOptionsValidated,
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
import { validateColor } from "./validateColor";
import { validateCSSPixel } from "./validateCSSPixel";
import { validateNonNegativeNumber } from "./validateNonNegativeNumber";
import { validateNonNegativeInt } from "./validateNonNegativeInt";

// - [ ] Check for non existent graph name or missing options for some graph names

export function validateConfig(options: ChartOptions): ChartOptionsValidated {
  return {
    x: validateXOptions(options.x),
    y: validateYOptions(options.y),
    overview: validateOverviewOptions(options.overview),
    tooltip: validateTooltipOptions(options.tooltip),
    viewBox: validateViewBoxOptions(options.viewBox),
    visibility: options.visibility,
    total: validateNonNegativeInt(options.total),
    width: validateCSSPixel(options.width),
    height: validateCSSPixel(options.height),
    lineWidth: validateCSSPixel(options.lineWidth),
    colors: validateColorsOptions(options.colors),
    data: options.data,
    lineJoin: options.lineJoin,

    domain: options.domain,
    graphNames: options.graphNames,
  };
}

export function validateXOptions(options: XOptions): XOptionsValidated {
  return {
    color: validateColor(options.color),
    ticks: validateNonNegativeInt(options.ticks),
    tick: {
      height: validateCSSPixel(options.tick.height), // positive?
      margin: validateCSSPixel(options.tick.margin), // positive?
    },
    label: {
      fontSize: validateCSSPixel(options.label.fontSize),
      fontFamily: options.label.fontFamily,
    },
    marginBottom: validateCSSPixel(options.marginBottom),
    marginTop: validateCSSPixel(options.marginTop),
  };
}

export function validateYOptions(options: YOptions): YOptionsValidated {
  return {
    color: validateColor(options.color),
    ticks: validateNonNegativeInt(options.ticks),
    label: {
      fontSize: validateCSSPixel(options.label.fontSize),
      fontFamily: options.label.fontFamily,
    },
  };
}

export function validateOverviewOptions(
  options: OverviewOptions
): OverviewOptionsValidated {
  return {
    height: validateCSSPixel(options.height),
    lineWidth: validateCSSPixel(options.lineWidth),
    overlayColor: validateColor(options.overlayColor),
    edgeColor: validateColor(options.edgeColor),
  };
}

export function validateTooltipOptions(
  options: TooltipOptions
): TooltipOptionsValidated {
  return {
    lineColor: validateColor(options.lineColor),
    backgroundColor: validateColor(options.backgroundColor),
    color: validateColor(options.color),
  };
}

export function validateViewBoxOptions(
  options: ViewBoxOptions
): ViewBoxOptionsValidated {
  return {
    startIndex: validateNonNegativeNumber(options.startIndex),
    endIndex: validateNonNegativeNumber(options.endIndex),
  };
}

export function validateColorsOptions(
  options: ColorsOptions
): ColorsOptionsValidated {
  const result = {} as ColorsOptionsValidated;

  for (const graphName in options) {
    result[graphName] = validateColor(options[graphName]);
  }

  return result;
}
