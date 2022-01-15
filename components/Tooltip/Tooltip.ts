import { effect, computeLazy, Lambda } from "@pvorona/observable";
import { ChartContext, ChartOptions } from "../../types";
import { getTooltipDateText } from "../../util";
import { DOT_SIZE, CENTER_OFFSET } from "../constants";
import { Component, Point } from "../types";

export const Tooltip: Component<ChartOptions, ChartContext> = (
  options,
  {
    isHovering,
    isDragging,
    isWheeling,
    isGrabbingGraphs,
    isAnyGraphEnabled,
    enabledGraphNames,
    mainGraphPoints,
    startIndex,
    mouseX,
  }
) => {
  const {
    tooltipContainer,
    tooltipCircles,
    tooltipLine,
    tooltip,
    tooltipValues,
    tooltipGraphInfo,
    tooltipDate,
  } = createDOM();

  // why lazy
  const isTooltipVisible = computeLazy(
    [isDragging, isHovering, isWheeling, isGrabbingGraphs, isAnyGraphEnabled],
    function isTooltipVisibleCompute(
      isDragging,
      isHovering,
      isWheeling,
      isGrabbingGraphs,
      isAnyGraphEnabled
    ) {
      return (
        !isWheeling &&
        !isDragging &&
        isHovering &&
        !isGrabbingGraphs &&
        isAnyGraphEnabled
      );
    }
  );

  let updateTooltipPositionAndTextEffectUnobserve: undefined | Lambda =
    undefined;
  let updateTooltipCirclesVisibilityEffectUnobserve: undefined | Lambda =
    undefined;
  let updateTooltipGraphInfoEffectUnobserve: undefined | Lambda = undefined;

  effect([isTooltipVisible], (isTooltipVisible) => {
    if (isTooltipVisible) {
      tooltipLine.style.visibility = "visible";
      tooltip.style.display = "block";

      // Test if it makes sense to extract effect functions outside of this effect
      // can use binary search here
      const tooltipIndex = computeLazy(
        [mouseX, mainGraphPoints],
        function tooltipIndexCompute(x, points) {
          let closestPointIndex = 0;
          for (let i = 1; i < points[options.graphNames[0]].length; i++) {
            const distance = Math.abs(
              points[options.graphNames[0]][i].x / devicePixelRatio - x
            );
            const closesDistance = Math.abs(
              points[options.graphNames[0]][closestPointIndex].x /
                devicePixelRatio -
                x
            );
            if (distance < closesDistance) closestPointIndex = i;
          }
          return closestPointIndex;
        }
      );

      updateTooltipPositionAndTextEffectUnobserve = effect(
        [mainGraphPoints, enabledGraphNames, tooltipIndex, startIndex],
        updateTooltipPositionAndText
      );

      updateTooltipCirclesVisibilityEffectUnobserve = effect(
        [enabledGraphNames],
        (enabledGraphNames) => {
          options.graphNames.forEach(
            (graphName) =>
              (tooltipCircles[graphName].style.visibility =
                enabledGraphNames.indexOf(graphName) > -1 ? "visible" : "")
          );
        }
      );

      updateTooltipGraphInfoEffectUnobserve = effect(
        [enabledGraphNames],
        (enabledGraphNames) => {
          options.graphNames.forEach((graphName) => {
            tooltipGraphInfo[graphName].hidden =
              !enabledGraphNames.includes(graphName);
          });
        }
      );
    } else {
      tooltipLine.style.visibility = "";
      tooltip.style.display = "";

      options.graphNames.forEach((graphName) => {
        tooltipCircles[graphName].style.visibility = "";
      });

      if (updateTooltipPositionAndTextEffectUnobserve) {
        updateTooltipPositionAndTextEffectUnobserve();
      }

      if (updateTooltipCirclesVisibilityEffectUnobserve) {
        updateTooltipCirclesVisibilityEffectUnobserve();
      }

      if (updateTooltipGraphInfoEffectUnobserve) {
        updateTooltipGraphInfoEffectUnobserve();
      }
    }
  });

  return { element: tooltipContainer };

  function updateTooltipPositionAndText(
    points: Record<string, Point[]>,
    enabledGraphNames: string[],
    index: number,
    startIndex: number
  ) {
    const { x } = points[enabledGraphNames[0]][index];
    tooltipLine.style.transform = `translateX(${(x - 1) / devicePixelRatio}px)`;
    const dataIndex = index + Math.floor(startIndex);
    for (let i = 0; i < enabledGraphNames.length; i++) {
      const { x, y } = points[enabledGraphNames[i]][index];
      tooltipCircles[enabledGraphNames[i]].style.transform = `translateX(${
        x / devicePixelRatio + CENTER_OFFSET
      }px) translateY(${y / devicePixelRatio + CENTER_OFFSET}px)`;
      tooltipValues[enabledGraphNames[i]].innerText = String(
        options.data[enabledGraphNames[i]][dataIndex]
      );
      // tooltipValues[enabledGraphNames[i]].innerText = getShortNumber(options.data[enabledGraphNames[i]][dataIndex])
    }
    tooltipDate.innerText = getTooltipDateText(options.domain[dataIndex]);
    // TODO: Force reflow
    tooltip.style.transform = `translateX(${
      x / devicePixelRatio - tooltip.offsetWidth / 2
    }px)`;
  }

  function createDOM() {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";

    const tooltipDate = document.createElement("div");
    tooltipDate.style.padding = "10px 10px 0";
    tooltip.appendChild(tooltipDate);

    const tooltipLegendContainer = document.createElement("div");
    tooltipLegendContainer.className = "tooltip__legend";
    tooltip.appendChild(tooltipLegendContainer);

    const tooltipValues: { [key: string]: HTMLDivElement } = {};
    const tooltipGraphInfos: { [key: string]: HTMLDivElement } = {};
    options.graphNames.forEach((graphName) => {
      const tooltipGraphInfo = document.createElement("div");
      tooltipGraphInfo.style.color = options.colors[graphName];
      tooltipGraphInfo.style.padding = "0 10px 10px";
      tooltipGraphInfos[graphName] = tooltipGraphInfo;

      const tooltipValue = document.createElement("div");
      tooltipValue.style.fontWeight = "bold";
      tooltipGraphInfo.appendChild(tooltipValue);

      const graphNameElement = document.createElement("div");
      graphNameElement.innerText = graphName;
      tooltipGraphInfo.appendChild(graphNameElement);

      tooltipValues[graphName] = tooltipValue;
      tooltipLegendContainer.appendChild(tooltipGraphInfo);
    });

    const tooltipContainer = document.createElement("div");
    const tooltipLine = document.createElement("div");
    tooltipLine.className = "tooltip-line";
    tooltipContainer.appendChild(tooltipLine);

    const tooltipCircles: { [key: string]: HTMLDivElement } = {};
    for (let i = 0; i < options.graphNames.length; i++) {
      const circle = document.createElement("div");
      circle.style.width = `${DOT_SIZE}px`;
      circle.style.height = `${DOT_SIZE}px`;
      circle.style.borderColor = options.colors[options.graphNames[i]];
      circle.className = "tooltip__dot";
      tooltipCircles[options.graphNames[i]] = circle;
      tooltipContainer.appendChild(circle);
    }

    tooltipContainer.appendChild(tooltip);

    return {
      tooltip,
      tooltipContainer,
      tooltipLine,
      tooltipCircles,
      tooltipValues,
      tooltipGraphInfo: tooltipGraphInfos,
      tooltipDate,
    };
  }
};
