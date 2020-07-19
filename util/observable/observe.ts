import { Lambda } from '../../types'
import {
  Observable,
  Gettable,
} from './types'

export function observe <A> (
  deps: [Observable<A> & Gettable<A>],
  observer: (valueA: A) => void,
): Lambda
export function observe <A, B> (
  deps: [Observable<A> & Gettable<A>, Observable<B> & Gettable <B>],
  observer: (valueA: A, valueB: B) => void,
): Lambda
export function observe <A, B, C> (
  deps: [Observable<A> & Gettable<A>, Observable<B> & Gettable <B>, Observable<C> & Gettable<C>],
  observer: (valueA: A, valueB: B, valueC: C) => void,
): Lambda
export function observe (
  deps: (Observable<any> & Gettable<any>)[],
  observer: (...args: any[]) => any,
): Lambda {
  notify()

  const unobserves = deps.map(dep => dep.observe(notify))

  function notify () {
    return observer(...deps.map(dep => dep.get()))
  }

  return () => {
    unobserves.forEach(unobserve => unobserve())
  }
}
