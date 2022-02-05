import {
  Observable,
  Gettable,
  Settable,
  computeLazy,
  observable,
  effect,
} from "@pvorona/observable";
import { getMinMax, max, min } from ".";

export function createMinMaxView(
  startIndex: Observable<number> & Gettable<number> & Settable<number>,
  endIndex: Observable<number> & Gettable<number> & Settable<number>,
  enabledGraphNames: Observable<string[]> & Gettable<string[]>,
  dataByGraphName: { [graphName: string]: number[] }
) {
  const visibleMinMaxByGraphName = computeLazy(
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

  const visibleMax = computeLazy(
    [visibleMinMaxByGraphName, enabledGraphNames],
    (visibleMinMaxByGraphName, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMax.get();

      let result = -Infinity;

      for (const graphName of enabledGraphNames) {
        result = max(result, visibleMinMaxByGraphName[graphName].max);
      }

      return result;
    }
  );

  const visibleMin = computeLazy(
    [visibleMinMaxByGraphName, enabledGraphNames],
    (visibleMinMaxByGraphName, enabledGraphNames) => {
      if (enabledGraphNames.length === 0) return prevVisibleMin.get();

      let result = +Infinity;

      for (const graphName of enabledGraphNames) {
        result = min(result, visibleMinMaxByGraphName[graphName].min);
      }

      return result;
    }
  );

  const prevVisibleMax = observable(+Infinity);

  effect([visibleMax], (visibleMax) => {
    prevVisibleMax.set(visibleMax);
  });

  const prevVisibleMin = observable(-Infinity);

  effect([visibleMin], (visibleMin) => {
    prevVisibleMin.set(visibleMin);
  });

  return { visibleMinMaxByGraphName, visibleMin, visibleMax };
}
