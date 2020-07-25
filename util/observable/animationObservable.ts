import { Lambda } from '../../types'
import { Observable, LazyObservable, Gettable } from './types'
import { Transition } from '../transition'
import { createTask, tasks, TASK, Task } from './rendering'

export function animationObservable <A> (
  innerObservable: (Observable<A> & Gettable<A>) | LazyObservable<A>,
  initialTransition: Transition<A>,
): LazyObservable<A> & { setTransition: (transition: Transition<A>) => void } {
  const observers: Lambda[] = []
  let futureTask: Task | undefined = undefined
  let transition = initialTransition
  let state = transition.getState()

  function notify () {
    for (const observer of observers) {
      observer()
    }
  }

  const get = () => {
    const newState = transition.getState()
    if (state !== newState) {
      state = newState
    }

    if (!transition.isFinished()) {
      if (!futureTask || futureTask.completed) {
        // if phase is rendering
        // execute notify task in next frame
        // else notify
        futureTask = createTask(notify)
        tasks[TASK.FUTURE].push(futureTask)
      }
    }

    return state
  }

  const set = (t?: A) => {
    // need better check if lazy
    const target = t ? t : innerObservable.get()
    // might need cancel task here
    // if (futureTask && !futureTask.cancelled) {
    //   cancelTask(futureTask)
    // }
    transition.setTarget(target)

    if (!transition.isFinished()) {
      notify()
    }
  }

  innerObservable.observe(set)

  return {
    get,
    observe (observer) {
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
    setTransition (newTransition) {
      newTransition.setTarget(transition.getTarget())
      transition = newTransition
    },
  }
}
