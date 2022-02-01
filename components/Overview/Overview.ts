import { ChartContext, ChartOptions } from "../../types";
import { Component } from "../types";
import { OverviewGraphs } from "./OverviewGraphs";
import { RangeSlider } from "./RangeSlider";

export const Overview: Component<ChartOptions, ChartContext> = (
  options,
  context
) => {
  const { element } = createDom();

  return { element };

  function createDom() {
    const containerClassName = "overview";
    const element = document.createElement("div");

    element.className = containerClassName;
    element.style.height = `${options.overview.height}px`;

    const graphs = OverviewGraphs(options, context);
    const rangeSlider = RangeSlider(options, context);

    element.appendChild(graphs.element);
    element.appendChild(rangeSlider.element);

    return {
      element,
      graphs,
    };
  }
};
