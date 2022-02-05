import { Controls } from "../Controls";
import { ChartOptions } from "../../types";
import { Overview } from "../Overview";
import { XAxis } from "../XAxis";
// import { YAxis } from "../YAxisV2";
import { Tooltip } from "../Tooltip";
import { Series } from "../Series";
import { ChartContext } from "../Context";
import { createScheduleTaskWithCleanup, PRIORITY } from "@pvorona/scheduling";
import { validateConfig } from "../../config";

export const Chart = (options: ChartOptions) => {
  const validatedOptions = validateConfig(options);
  const context = ChartContext(validatedOptions);
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

    const series = Series(validatedOptions, context);
    const overview = Overview(validatedOptions, context);
    const controls = Controls(validatedOptions, context);
    const tooltip = Tooltip(validatedOptions, context);
    const xAxis = XAxis(validatedOptions, context);
    // const yAxis = YAxis(validatedOptions, context);

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
