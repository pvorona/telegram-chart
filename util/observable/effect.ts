import { Lambda } from '../../types'
import {
  Observable,
  Gettable,
  LazyObservable,
} from './types'

import { performEffect } from '../animate'

export function effect <A> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>],
  observer: (valueA: A) => void,
): Lambda
export function effect <A, B> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>],
  observer: (valueA: A, valueB: B) => void,
): Lambda
export function effect <A, B, C> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>],
  observer: (valueA: A, valueB: B, valueC: C) => void,
): Lambda
export function effect <A, B, C, D> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>, (Observable<D> & Gettable<D>) | LazyObservable<D>],
  observer: (valueA: A, valueB: B, valueC: C, valueD: D) => void,
): Lambda
export function effect <A, B, C, D, E> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>, (Observable<D> & Gettable<D>) | LazyObservable<D>, (Observable<E> & Gettable<E>) | LazyObservable<E>],
  observer: (valueA: A, valueB: B, valueC: C, valueD: D, valueE: E) => void,
): Lambda
export function effect (
  deps: ((Observable<any> & Gettable<any>) | LazyObservable<any>)[],
  observer: (...args: any[]) => void,
): Lambda {
  const scheduleNotify = performEffect(function notify () {
    const values = []
    for (const dep of deps) {
      values.push(dep.get())
    }
    observer(...values)
    // console.log('Effect', observer.name)
  })
  const unobserves = deps.map(dep => dep.observe(scheduleNotify))

  scheduleNotify()

  return () => {
    unobserves.forEach(unobserve => unobserve())
  }
}
