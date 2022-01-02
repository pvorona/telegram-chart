import { effect, observable } from "@pvorona/observable";
import { cursors } from "./constants";

export const ChartContext = (() => {
  const isDragging = observable(false);
  const isWheeling = observable(false);
  const isGrabbingGraphs = observable(false);
  const activeCursor = observable(cursors.default);

  effect([activeCursor], (cursor) => {
    document.body.style.cursor = cursor;
  });

  return { isDragging, isWheeling, isGrabbingGraphs, activeCursor };
})();
