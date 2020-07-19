import { observable } from './observable'
import {
  Observable,
  Settable,
  Gettable,
} from './types'

export function compute <A, O> (
  deps: [Observable<A> & Gettable<A>],
  compute: (valueA: A) => O,
): Observable<O> & Gettable<O> & Settable<O>
export function compute <A, B, O> (
  deps: [Observable<A> & Gettable<A>, Observable<B> & Gettable<B>],
  compute: (valueA: A, valueB: B) => O,
): Observable<O> & Gettable<O> & Settable<O>
export function compute <A, B, C, O> (
  deps: [Observable<A> & Gettable<A>, Observable<B> & Gettable<B>, Observable<C> & Gettable<C>],
  compute: (valueA: A, valueB: B, valueC: C) => O,
): Observable<O> & Gettable<O> & Settable<O>
export function compute (
  deps: (Observable<any> & Gettable<any>)[],
  compute: (...args: any[]) => any,
): Observable<any> & Gettable<any> & Settable<any> {
  const obs = observable(recompute())

  const unobserves = deps.map(dep => dep.observe(onChange))

  function onChange () {
    obs.set(recompute())
  }

  function recompute () {
    return compute(...deps.map(dep => dep.get()))
  }

  return {
    ...obs,
    observe: (observer) => {
      const ownUnobserve = obs.observe(observer)

      return () => {
        ownUnobserve()
        unobserves.forEach(unobserve => unobserve())
      }
    },
  }
}
