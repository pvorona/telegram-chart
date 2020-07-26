import { Lambda } from '../../types'
import {
  Observable,
  Gettable,
  LazyObservable,
} from './types'

import { createScheduleEffect as defaultCreateScheduleEffect } from './rendering'

export function effect <A> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>],
  observer: (valueA: A) => void,
  createScheduleEffect?: (l: Lambda) => Lambda,
): Lambda
export function effect <A, B> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>],
  observer: (valueA: A, valueB: B) => void,
  createScheduleEffect?: (l: Lambda) => Lambda,
): Lambda
export function effect <A, B, C> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>],
  observer: (valueA: A, valueB: B, valueC: C) => void,
  createScheduleEffect?: (l: Lambda) => Lambda,
): Lambda
export function effect <A, B, C, D> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>, (Observable<D> & Gettable<D>) | LazyObservable<D>],
  observer: (valueA: A, valueB: B, valueC: C, valueD: D) => void,
  createScheduleEffect?: (l: Lambda) => Lambda,
): Lambda
export function effect <A, B, C, D, E> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>, (Observable<D> & Gettable<D>) | LazyObservable<D>, (Observable<E> & Gettable<E>) | LazyObservable<E>],
  observer: (valueA: A, valueB: B, valueC: C, valueD: D, valueE: E) => void,
  createScheduleEffect?: (l: Lambda) => Lambda,
): Lambda
export function effect (
  deps: ((Observable<any> & Gettable<any>) | LazyObservable<any>)[],
  observer: (...args: any[]) => void,
  createScheduleEffect: ((l: Lambda) => Lambda) = defaultCreateScheduleEffect,
): Lambda {
  let scheduledEffect = false

  const scheduleEffect = createScheduleEffect(function notify () {
    const values = []
    for (const dep of deps) {
      values.push(dep.get())
    }
    observer(...values)
    scheduledEffect = false
  })

  const scheduleNotify = () => {
    if (scheduledEffect) return
    scheduledEffect = true
    scheduleEffect()
  }
  const unobserves = deps.map(dep => dep.observe(scheduleNotify))

  scheduleNotify()

  return () => {
    unobserves.forEach(unobserve => unobserve())
  }
}
