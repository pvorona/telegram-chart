// import { Lambda } from '../types'

export function memoizeOne <A> (fun: (...args: any[]) => A) {
  let calledOnce = false
  let prevArgs: any[]
  let result: A

  return function memoized (...args: any[]): A {
    if (calledOnce && argsEqual(prevArgs, args)) {
      return result
    }
    calledOnce = true
    prevArgs = args
    result = fun.apply(undefined, args)
    return result
  }
}

function argsEqual (a: any[], b: any[]) {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }

  return true
}