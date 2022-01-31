const MEASURE_PREFIX = "measure";
let index = 0;

// - [ ] Moving average series
// - [ ] p95
// - [ ] Timing distribution

export function measurePerformance<T extends any[], R>(
  fn: (...params: T) => R
) {
  const name = fn.name;

  return function (...args: T) {
    const currentIteration = index++;
    performance.mark(`${name}_${currentIteration}`);
    const result = fn(...args);
    performance.measure(
      `${MEASURE_PREFIX}_${name}`,
      `${name}_${currentIteration}`
    );
    return result;
  };
}

function mean(mark: string) {
  return meanArray(
    performance
      .getEntriesByName(`${MEASURE_PREFIX}_${mark}`)
      .map((entry) => entry.duration)
  );
}

function invocations(mark: string) {
  return performance.getEntriesByName(`${MEASURE_PREFIX}_${mark}`).length;
}

function meanArray(array: number[]) {
  const sum = array.reduce((total, n) => total + n, 0);
  return sum / array.length;
}

function stats(mark: string) {
  return {
    mark,
    mean: mean(mark),
    invocations: invocations(mark),
  };
}

(window as any).stats = stats;
