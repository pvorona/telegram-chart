import {
  Observable,
  Gettable,
  Settable,
  computeLazy,
  observable,
  effect,
} from "@pvorona/observable";
import { getMinMax } from "./getMinMax";

export function createMinMaxView(
  startIndex: Observable<number> & Gettable<number> & Settable<number>,
  endIndex: Observable<number> & Gettable<number> & Settable<number>,
  enabledGraphNames: Observable<string[]> & Gettable<string[]>,
  dataByGraphName: { [graphName: string]: number[] }
) {
  const minMaxByGraphName = computeLazy(
    [startIndex, endIndex, enabledGraphNames],
    (startIndex, endIndex, enabledGraphNames) => {
      const result: { [graphName: string]: { min: number; max: number } } = {};

      for (let i = 0; i < enabledGraphNames.length; i++) {
        const graphName = enabledGraphNames[i];

        result[graphName] = getMinMax(
          startIndex,
          endIndex,
          dataByGraphName[graphName]
        );
      }

      return result;
    }
  );

  const max = computeLazy(
    [minMaxByGraphName, enabledGraphNames],
    (visibleMinMaxByGraphName, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMax.get();

      let result = -Infinity;

      for (const graphName of enabledGraphNames) {
        result = Math.max(result, visibleMinMaxByGraphName[graphName].max);
      }

      return result;
    }
  );

  const min = computeLazy(
    [minMaxByGraphName, enabledGraphNames],
    (visibleMinMaxByGraphName, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMin.get();

      let result = +Infinity;

      for (const graphName of enabledGraphNames) {
        result = Math.min(result, visibleMinMaxByGraphName[graphName].min);
      }

      return result;
    }
  );

  const prevVisibleMax = observable(+Infinity);

  effect([max], (visibleMax) => {
    prevVisibleMax.set(visibleMax);
  });

  const prevVisibleMin = observable(-Infinity);

  effect([min], (visibleMin) => {
    prevVisibleMin.set(visibleMin);
  });

  return { minMaxByGraphName, min, max };
}
