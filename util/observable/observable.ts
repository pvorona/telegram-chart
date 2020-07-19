import {
  Observer,
  Observable,
  Settable,
  Gettable,
} from './types'

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


// function gettable <A> (observable: Observable<A>): Gettable<A> {
//   let value: A

//   observable.observe(newValue => value = newValue)

//   function get () {
//     return value
//   }

//   return { get }
// }
