import { memoizeOne } from './memoizeOne'

export var computed = (dependencyGetters, compute) => {
  const memoizedCompute = memoizeOne(compute)
  return () => memoizedCompute(...dependencyGetters.map(get => get()))
}
