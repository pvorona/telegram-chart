import { ChartContext, ChartOptions } from "../../types";
import { Component } from "../types";

export const Controls: Component<ChartOptions, ChartContext> = (
  config,
  { enabledStateByGraphName }
) => {
  const element = document.createElement("div");
  element.style.position = "fixed";
  element.style.right = "20px";
  element.style.top = "20px";

  function onButtonClick(graphName: string) {
    enabledStateByGraphName.set({
      ...enabledStateByGraphName.get(),
      [graphName]: !enabledStateByGraphName.get()[graphName],
    });
  }

  config.graphNames.forEach((graphName) => {
    const label = document.createElement("label");
    label.style.marginRight = "15px";

    const input = document.createElement("input");
    input.checked = true;
    input.type = "checkbox";
    input.className = "button";
    input.onclick = () => onButtonClick(graphName);

    const button = document.createElement("div");
    button.className = "like-button";
    button.style.color = config.colors[graphName];

    const text = document.createElement("div");
    text.className = "button-text";
    text.innerText = graphName;

    button.appendChild(text);
    label.appendChild(input);
    label.appendChild(button);
    element.appendChild(label);
  });

  return { element };
};
