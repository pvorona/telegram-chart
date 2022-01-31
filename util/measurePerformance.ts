const MEASURE_PREFIX = "measure";
let index = 0;

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

function perf(mark: string) {
  return mean(
    performance
      .getEntriesByName(`${MEASURE_PREFIX}_${mark}`)
      .map((entry) => entry.duration)
  );
}

function mean(array: number[]) {
  const sum = array.reduce((total, n) => total + n, 0);
  return sum / array.length;
}

(window as any).perf = perf;
