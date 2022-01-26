import { Controls } from "../Controls";
import { ChartOptions } from "../../types";
import { Overview } from "../Overview";
import { XAxis } from "../XAxis";
// import { YAxis } from "../YAxisV2";
import { Tooltip } from "../Tooltip";
import { Graphs } from "./Graphs";
import { ChartContext } from "../Context";
import { createScheduleTaskWithCleanup, PRIORITY } from "@pvorona/observable";

export const Chart = (options: ChartOptions) => {
  const context = ChartContext(options);
  const { width, height } = context;
  const { element } = createDom();

  const resizeListener = createScheduleTaskWithCleanup(function measureSize() {
    width.set(element.offsetWidth);
    height.set(element.offsetHeight);
  }, PRIORITY.READ);

  window.addEventListener("resize", resizeListener);

  return { element, destroy };

  function destroy() {
    window.removeEventListener("resize", resizeListener);
  }

  function createDom() {
    const element = document.createElement("div");
    element.style.height = "100%";
    const graphs = Graphs(options, context);
    const overview = Overview(options, context);
    const controls = Controls(options, context);
    const tooltip = Tooltip(options, context);
    const xAxis = XAxis(options, context);
    // const yAxis = YAxis(options, context);

    graphs.element.appendChild(tooltip.element);
    // element.appendChild(yAxis.element);
    element.appendChild(graphs.element);
    element.appendChild(xAxis.element);
    element.appendChild(overview.element);
    element.appendChild(controls.element);

    return {
      element,
    };
  }
};
