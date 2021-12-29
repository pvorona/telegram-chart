import { Lambda } from '../../types'

export type Observer<A> = (value: A) => void

export interface Observable <A> {
  observe: (observer: Observer<A>) => Lambda
}

export interface Settable <A> {
  set: (value: A) => void
}

export interface Gettable <A> {
  get: () => A
}

export interface LazyObservable <A> extends Gettable <A> {
  observe: (observer: Lambda) => Lambda
}

export type ObservableValue <T> = Observable<T> & Gettable<T> & Settable<T>