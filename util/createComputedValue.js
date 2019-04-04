import { memoizeOne } from './memoizeOne'

export var createComputedValue = (...dependencyGetters) => (compute) => {
  const memoizedCompute = memoizeOne(compute)
  return () => memoizedCompute(...dependencyGetters.map(get => get()))
}



// const getViewBoxLeft = () => overviewState.left

// const startIndex = compose(
//   createComputedValue(getViewBoxLeft),
// )(
//   (viewBoxLeft) => left / options.width * (options.data.total - 1)
// )


// c = createComputedValue(
//   () => console.log('a called') || 1,
//   () => console.log('b called') || 2,
// )(
//   (fromA, fromB) => console.log('c called') || `fromA: ${fromA}, fromB: ${fromB}`
// )