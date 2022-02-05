import { Controls } from "../Controls";
import { UncheckedChartOptions } from "../../types";
import { Overview } from "../Overview";
import { XAxis } from "../XAxis";
// import { YAxis } from "../YAxisV2";
import { Tooltip } from "../Tooltip";
import { Series } from "../Series";
import { ChartContext } from "../Context";
import { createScheduleTaskWithCleanup, PRIORITY } from "@pvorona/scheduling";
import { validateConfig } from "../../config";

export const Chart = (uncheckedOptions: UncheckedChartOptions) => {
  const options = validateConfig(uncheckedOptions);
  const context = ChartContext(options);
  const { width, height } = context;
  const { element } = createDOM();

  const resizeListener = createScheduleTaskWithCleanup(
    function measureContainerSize() {
      width.set(element.offsetWidth);
      height.set(element.offsetHeight);
    },
    PRIORITY.READ
  );

  window.addEventListener("resize", resizeListener);

  return { element, destroy };

  function destroy() {
    window.removeEventListener("resize", resizeListener);
  }

  function createDOM() {
    const element = document.createElement("div");

    element.style.display = "flex";
    element.style.flexDirection = "column";

    const series = Series(options, context);
    const overview = Overview(options, context);
    const controls = Controls(options, context);
    const tooltip = Tooltip(options, context);
    const xAxis = XAxis(options, context);
    // const yAxis = YAxis(options, context);

    series.element.appendChild(tooltip.element);
    // element.appendChild(yAxis.element);
    element.appendChild(series.element);
    element.appendChild(xAxis.element);
    element.appendChild(overview.element);
    element.appendChild(controls.element);

    return {
      element,
    };
  }
};
