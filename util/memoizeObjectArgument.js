import { shallowEqual } from './shallowEqual'

export function memoizeObjectArgument (fun) {
  let prevObject = {}
  let prevResult

  return function memoized (object) {
    if (shallowEqual(object, prevObject)) {
      return prevResult
    }
    prevObject = object
    prevResult = fun(object)
    return prevResult
  }
}
