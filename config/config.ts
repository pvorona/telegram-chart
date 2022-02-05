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
import { validateCssPixel } from "./validateCssPixel";
import { validateNonNegativeNumber } from "./validateNonNegativeNumber";
import { validateNonNegativeInt } from "./validateNotNegativeInt";

// - [ ] Check for non existent graph name or missing options for some graph names

export function validate(options: ChartOptions): ChartOptionsValidated {
  return {
    x: validateXOptions(options.x),
    y: validateYOptions(options.y),
    overview: validateOverviewOptions(options.overview),
    tooltip: validateTooltipOptions(options.tooltip),
    viewBox: validateViewBoxOptions(options.viewBox),
    visibility: options.visibility,
    total: validateNonNegativeInt(options.total),
    width: validateCssPixel(options.width),
    height: validateCssPixel(options.height),
    lineWidth: validateCssPixel(options.lineWidth),
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
      height: validateCssPixel(options.tick.height), // positive?
      margin: validateCssPixel(options.tick.margin), // positive?
    },
    label: {
      fontSize: validateCssPixel(options.label.fontSize),
      fontFamily: options.label.fontFamily,
    },
    marginBottom: validateCssPixel(options.marginBottom),
    marginTop: validateCssPixel(options.marginTop),
  };
}

export function validateYOptions(options: YOptions): YOptionsValidated {
  return {
    color: validateColor(options.color),
    ticks: validateNonNegativeInt(options.ticks),
    label: {
      fontSize: validateCssPixel(options.label.fontSize),
      fontFamily: options.label.fontFamily,
    },
  };
}

export function validateOverviewOptions(
  options: OverviewOptions
): OverviewOptionsValidated {
  return {
    height: validateCssPixel(options.height),
    lineWidth: validateCssPixel(options.lineWidth),
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
