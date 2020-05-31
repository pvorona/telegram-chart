import { memoizeOne } from './memoizeOne'

export const computed = (dependencyGetters, compute) => {
  const memoizedCompute = memoizeOne(compute)
  return (state) => memoizedCompute(...dependencyGetters.map(get => get(state)))
}

export function createState (initialState) {
  const state = {}
  for (const key in initialState) {
    if (typeof initialState[key] === 'function') {
      Object.defineProperty(state, key, {
        enumerable: true,
        get: function () {
          return initialState[key](state)
        }
      })
      state
    } else {
      state[key] = initialState[key]
    }
  }
  return state
}
