import { effect, computeLazy } from "@pvorona/observable";
import { ChartContext, ChartOptions } from "../../types";
import { getTooltipDateText } from "../../util";
import { DOT_SIZE, CENTER_OFFSET } from "../constants";
import { Component } from "../types";

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

  effect(
    [isTooltipVisible, enabledGraphNames],
    function updateTooltipVisibilityEffect(visible, enabledGraphNames) {
      tooltipLine.style.visibility = visible ? "visible" : "";
      tooltip.style.display = visible ? "block" : "";
      options.graphNames.forEach(
        (graphName) =>
          (tooltipCircles[graphName].style.visibility =
            visible && enabledGraphNames.indexOf(graphName) > -1
              ? "visible"
              : "")
      );
      if (!visible) return;
      options.graphNames.forEach(
        (graphName) =>
          (tooltipGraphInfo[graphName].hidden =
            enabledGraphNames.indexOf(graphName) > -1 ? false : true)
      );
    }
  );

  // can use binary search here
  const tooltipIndex = computeLazy(
    [mouseX, mainGraphPoints, isTooltipVisible],
    function tooltipIndexCompute(x, points, isTooltipVisible) {
      if (!isTooltipVisible) return 0;

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

  effect(
    [
      isTooltipVisible,
      mainGraphPoints,
      enabledGraphNames,
      tooltipIndex,
      startIndex,
    ],
    // [isTooltipVisible, getMainGraphPointsObservable, enabledGraphNames, getTooltipIndexObservable, inertStartIndex],
    function updateTooltipPositionAndTextEffect(
      isTooltipVisible,
      points,
      enabledGraphNames,
      index,
      startIndex
    ) {
      if (!isTooltipVisible) return;

      const { x } = points[enabledGraphNames[0]][index];
      tooltipLine.style.transform = `translateX(${
        (x - 1) / devicePixelRatio
      }px)`;
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
  );

  return { element: tooltipContainer };

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
