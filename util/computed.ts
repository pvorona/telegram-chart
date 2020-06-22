// import { Lambda } from '../types'
import { memoizeOne } from './memoizeOne'

export const computed = <A> (
  dependencyGetters: (() => any)[],
  compute: (...args: any[]) => A,
) => {
  const memoizedCompute = memoizeOne(compute)
  return () => memoizedCompute(...dependencyGetters.map(get => get()))
}

// export function createState (initialState) {
//   const state = {}
//   for (const key in initialState) {
//     if (typeof initialState[key] === 'function') {
//       Object.defineProperty(state, key, {
//         enumerable: true,
//         get: function () {
//           return initialState[key](state)
//         }
//       })
//       state
//     } else {
//       state[key] = initialState[key]
//     }
//   }
//   return state
// }
