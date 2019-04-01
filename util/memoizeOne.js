export function memoizeOne (fun) {
  let calledOnce = false
  let prevArgs
  let result

  return function memoized () {
    if (calledOnce && argsEqual(prevArgs, arguments)) {
      return result
    }
    calledOnce = true
    prevArgs = arguments
    result = fun.apply(undefined, arguments)
    return result
  }
}

function argsEqual (a, b) {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }

  return true
}