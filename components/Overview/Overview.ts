import {
  animationObservable,
  effect,
  computeLazy,
  observable,
  observe,
  transition,
} from "@pvorona/observable";
import { renderLineSeriesWithAreaGradient } from "../renderers";
import { ChartContext, ChartOptions } from "../../types";
import { easeInOutQuart, linear } from "../../easings";
import { mapDataToCoords, getMaxValue, getMinValue } from "../../util";
import { FAST_TRANSITIONS_TIME, LONG_TRANSITIONS_TIME } from "../constants";
import { Point, Component } from "../types";
import { createGraphs } from "../Chart/createGraphs";
import { RangeSlider } from "./RangeSlider";

const VIEWBOX_TOP_BOTTOM_BORDER_WIDTH = 2;

export const Overview: Component<ChartOptions, ChartContext> = (
  options,
  context
) => {
  const {
    isDragging,
    isWheeling,
    width,
    enabledGraphNames,
    inertOpacityStateByGraphName,
  } = context;

  const canvasCssHeight =
    options.overview.height - 2 * VIEWBOX_TOP_BOTTOM_BORDER_WIDTH;

  const overallMax = computeLazy([enabledGraphNames], (enabledGraphNames) => {
    if (enabledGraphNames.length === 0) return prevOverallMax.get();

    // can remove unnecessary abstraction
    return getMaxValueInRange(0, options.total - 1, enabledGraphNames);
  });

  const prevOverallMax = observable(Infinity);

  effect([overallMax], (overallMax) => {
    prevOverallMax.set(overallMax);
  });

  const overallMin = computeLazy([enabledGraphNames], (enabledGraphNames) => {
    if (enabledGraphNames.length === 0) return prevOverallMin.get();

    return getMinValueInRange(0, options.total - 1, enabledGraphNames);
  });

  const prevOverallMin = observable(-Infinity);

  effect([overallMin], (overallMin) => {
    prevOverallMin.set(overallMin);
  });

  const inertOverallMax = animationObservable(
    overallMax,
    transition(overallMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );
  const inertOverallMin = animationObservable(
    overallMin,
    transition(overallMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
  );

  const overviewGraphPoints = computeLazy(
    [inertOverallMax, inertOverallMin, width],
    (inertOverallMax, inertOverallMin, width) => {
      return options.graphNames.reduce(
        (points, graphName) => ({
          ...points,
          [graphName]: mapDataToCoords(
            options.data[graphName],
            options.domain,
            inertOverallMax,
            inertOverallMin,
            {
              width: width * devicePixelRatio,
              height: canvasCssHeight * devicePixelRatio,
            },
            { startIndex: 0, endIndex: options.total - 1 },
            options.lineWidth * devicePixelRatio
          ),
        }),
        {} as { [key: string]: Point[] }
      );
    }
  );

  observe([isDragging, isWheeling], (isDragging, isWheeling) => {
    if (isDragging || isWheeling) {
      inertOverallMax.setTransition(
        transition(inertOverallMax.get(), FAST_TRANSITIONS_TIME, linear)
      );
      inertOverallMin.setTransition(
        transition(inertOverallMin.get(), FAST_TRANSITIONS_TIME, linear)
      );
    } else {
      inertOverallMax.setTransition(
        transition(inertOverallMax.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
      );
      inertOverallMin.setTransition(
        transition(inertOverallMin.get(), LONG_TRANSITIONS_TIME, easeInOutQuart)
      );
    }
  });

  const { element, graphs } = createDom({
    width: width.get(),
    height: options.overview.height,
    canvasCssHeight,
    edgeColor: options.overview.edgeColor,
    backdropColor: options.overview.overlayColor,
  });

  effect([width], (width) => {
    graphs.canvas.width = width * window.devicePixelRatio;
    graphs.canvas.height = canvasCssHeight * window.devicePixelRatio;

    updatePoints(overviewGraphPoints.get(), inertOpacityStateByGraphName.get());
  });

  effect(
    [overviewGraphPoints, inertOpacityStateByGraphName],
    (overviewGraphPoints, inertOpacityStateByGraphName) => {
      graphs.context.clearRect(
        0,
        0,
        width.get() * devicePixelRatio,
        canvasCssHeight * devicePixelRatio
      );

      updatePoints(overviewGraphPoints, inertOpacityStateByGraphName);
    }
  );

  function updatePoints(
    overviewGraphPoints: { [key: string]: Point[] },
    inertOpacityStateByGraphName: { [key: string]: number }
  ) {
    renderLineSeriesWithAreaGradient({
      opacityState: inertOpacityStateByGraphName,
      points: overviewGraphPoints,
      context: graphs.context,
      graphNames: options.graphNames,
      lineWidth: options.overview.lineWidth,
      strokeStyles: options.colors,
      height: canvasCssHeight,
      width: width.get(),
      // Use `miter` line join in overview?
      lineJoinByName: options.lineJoin,
    });
  }

  function getMaxValueInRange(
    startIndex: number,
    endIndex: number,
    graphNames: string[]
  ) {
    return getMaxValue({ startIndex, endIndex }, getValues(graphNames));
  }

  function getMinValueInRange(
    startIndex: number,
    endIndex: number,
    graphNames: string[]
  ) {
    return getMinValue({ startIndex, endIndex }, getValues(graphNames));
  }

  function getValues(graphNames: string[]) {
    return graphNames.map((graphName) => options.data[graphName]);
  }

  return { element };

  function createDom({
    width,
    height,
    canvasCssHeight,
  }: {
    width: number;
    height: number;
    canvasCssHeight: number;
    edgeColor: string;
    backdropColor: string;
  }) {
    const containerClassName = "overview";
    const element = document.createElement("div");
    element.className = containerClassName;
    element.style.height = `${height}px`;
    // element.style.padding = `${2}px 0`;

    const graphs = createGraphs({
      width,
      height: canvasCssHeight,
    });
    graphs.element.style.marginTop = `${VIEWBOX_TOP_BOTTOM_BORDER_WIDTH}px`;
    const rangeSlider = RangeSlider(options, context);

    element.appendChild(graphs.element);
    element.appendChild(rangeSlider.element);

    // return html`
    //   <div ref="element" class="overview" style="height: ${height}px">
    //     ${withRef('graphs', createGraphs({ width, height }))}
    //     <div ref="viewbox" class="overview__viewbox">
    //       <div ref="resizerLeft" class="overview__resize-handler overview__resize-handler--left"></div>
    //       <div ref="resizerRight" class="overview__resize-handler overview__resize-handler--right"></div>
    //     </div>
    //   </div>
    // `;

    return {
      element,
      graphs,
    };
  }
};
