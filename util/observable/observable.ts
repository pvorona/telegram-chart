import { Lambda } from '../../types'
import {
  Observer,
  Observable,
  Settable,
  Gettable,
  LazyObservable,
} from './types'

import { oncePerFrame } from '../animate'

export function observable <A> (
  initialValue: A,
): Observable<A> & Settable<A> & Gettable<A> {
  let value = initialValue
  const observers: Observer<A>[] = []

  function notify () {
    for (const observer of observers) {
      observer(value)
    }
  }

  return {
    set (newValue) {
      if (newValue === value) return
      value = newValue
      notify()
    },
    get () {
      return value
    },
    // fire immegiately can solve Gettable dependency
    observe (observer: Observer<A>) {
      observers.push(observer)

      return () => {
        for (let i = 0; i < observers.length; i++) {
          if (observers[i] === observer) {
            observers.splice(i, 1)
            return
          }
        }
      }
    },
  }
}

// export function pureObservable <A> (
//   // initialValue: A,
// ): Observable<A> & Settable<A> {
//   const observers: Observer<A>[] = []

//   return {
//     set (value) {
//       observers.forEach(observer => observer(value))
//     },
//     // fire immegiately can solve Gettable dependency
//     observe (observer: Observer<A>) {
//       observers.push(observer)

//       return () => {
//         for (let i = 0; i < observers.length; i++) {
//           if (observers[i] === observer) {
//             observers.splice(i, 1)
//             return
//           }
//         }
//       }
//     },
//   }
// }

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

// function gettable <A> (observable: Observable<A>): Gettable<A> {
//   let value: A

//   observable.observe(newValue => value = newValue)

//   function get () {
//     return value
//   }

//   return { get }
// }

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
  const scheduleNotify = oncePerFrame(function notify () {
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
