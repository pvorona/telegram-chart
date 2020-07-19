import { Lambda } from '../../types'
import {
  Observable,
  Gettable,
  LazyObservable,
} from './types'

export function computeLazy <A, V> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>],
  compute: (valueA: A) => V,
): LazyObservable<V>
export function computeLazy <A, B, V> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>],
  compute: (valueA: A, valueB: B) => V,
): LazyObservable<V>
export function computeLazy <A, B, C, V> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>],
  compute: (valueA: A, valueB: B, valueC: C) => V,
): LazyObservable<V>
export function computeLazy <A, B, C, D, V> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>, (Observable<D> & Gettable<D>) | LazyObservable<D>],
  compute: (valueA: A, valueB: B, valueC: C, valueD: D) => V,
): LazyObservable<V>
export function computeLazy <A, B, C, D, E, V> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>, (Observable<D> & Gettable<D>) | LazyObservable<D>, (Observable<E> & Gettable<E>) | LazyObservable<E>],
  compute: (valueA: A, valueB: B, valueC: C, valueD: D, valueE: E) => V,
): LazyObservable<V>
export function computeLazy <A, B, C, D, E, F, V> (
  deps: [(Observable<A> & Gettable<A>) | LazyObservable<A>, (Observable<B> & Gettable<B>) | LazyObservable<B>, (Observable<C> & Gettable<C>) | LazyObservable<C>, (Observable<D> & Gettable<D>) | LazyObservable<D>, (Observable<E> & Gettable<E>) | LazyObservable<E>, (Observable<F> & Gettable<F>) | LazyObservable<F>],
  compute: (valueA: A, valueB: B, valueC: C, valueD: D, valueE: E, valueF: F) => V,
): LazyObservable<V>
export function computeLazy <A> (
  deps: ((Observable<any> & Gettable<any>) | LazyObservable<any>)[],
  compute: (...args: any[]) => any,
): LazyObservable<any> {
  const observers: Lambda[] = []
  let value: A | undefined
  let dirty = true

  for (const dep of deps) {
    dep.observe(markDirty)
  }

  function markDirty () {
    dirty = true
    for (const observer of observers) {
      observer()
    }
  }

  function recompute () {
    const values = []
    for (const dep of deps) {
      values.push(dep.get())
    }
    // console.log('computeLazy', compute.name)
    return compute(...values)
  }

  return {
    get () {
      if (dirty) {
        value = recompute()
        dirty = false
      }
      return value
    },
    observe (observer: Lambda) {
      observers.push(observer)

      return () => {
        for (let i = 0; i < observers.length; i++) {
          if (observers[i] === observer) {
            observers.splice(i, 1)
            return
          }
        }
      }
    }
  }
}
