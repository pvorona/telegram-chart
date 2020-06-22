import { Lambda } from '../types'
import { Observable, LazyObservable, Gettable } from './observable/types'
import { Transition } from './transition'

// import { shallowEqual } from './shallowEqual'

// export function animate (from, to, duration, easing, callback) {
//   const startAnimationTime = performance.now() + performance.timing.navigationStart
//   let lastDispatchedValue = from
//   let animating = true
//   let animationId

//   function frame (currentTime) {
//     if (currentTime - startAnimationTime >= duration) {
//       if (lastDispatchedValue !== to) {
//         callback(to)
//       }
//       animating = false
//     } else {
//       const currentValue = easing(
//         (currentTime - startAnimationTime) / duration
//       ) * (to - from) + from
//       callback(currentValue)
//       lastDispatchedValue = currentValue
//       animationId = requestAnimationFrame(frame)
//     }
//   }
//   animationId = requestAnimationFrame(frame)

//   return function cancelAnimation () {
//     if (animating) {
//       const currentTime = performance.now() + performance.timing.navigationStart
//       callback(easing(
//         (currentTime - startAnimationTime) / duration
//       ) * (to - from) + from)
//       cancelAnimationFrame(animationId)
//     }
//   }
// }

// export function animation (transition, onFrame) {
//   let animationId = undefined
//   let lastDispatchedState = {}
//   let state = transition.getState()

//   const scheduleUpdate = () => {
//     if (animationId === undefined) {
//       animationId = requestAnimationFrame(handleAnimationFrame)
//     }
//   }

//   const getState = () => {
//     return state
//   }

//   const handleAnimationFrame = () => {
//     animationId = undefined

//     if (!transition.isFinished()) {
//       scheduleUpdate()
//     }

//     const newState = transition.getState()
//     if (!shallowEqual(newState, state)) {
//       state = newState
//       onFrame(state)
//     }
//   }

//   const setTarget = target => {
//     if (animationId) {
//       cancelAnimationFrame(animationId)
//       animationId = undefined
//     }
//     let shouldAnimate = false

//     transition.setTarget(target)

//     if (!transition.isFinished()) {
//       scheduleUpdate()
//     }
//   }

//   return {
//     setTarget,
//     getState,
//   }
// }

const INTERACTING = 'INTERACTING'
const RENDERING = 'RENDERING'
const queue = {
  phase: INTERACTING
}

export function oncePerFrame (original: () => void, priority = TASK.DOM_WRITE): () => void {
  let task: Task

  return function wrapperEffect () {
    if (task === undefined || task.completed || task.cancelled) {
      task = scheduleTask(original, priority)
    }
  }
}

// function computation (compute: () => void): () => void {
//   let task: Task

//   function wrappedComputation () {
//     if (queue.phase === RENDERING) {
//       compute()
//     } else {
//       if (task === undefined || task.completed || task.cancelled) {
//         task = scheduleTask(compute, TASK.COMPUTATION)
//       }
//     }
//   }

//   if (name) {
//     // wrappedComputation.name = `${wrappedComputation.name}(${name})`
//   }

//   return wrappedComputation
// }


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

var renderFrameId: undefined | number = undefined

function scheduleRender () {
  if (renderFrameId) return
  renderFrameId = requestAnimationFrame(render)
}

enum TASK {
  DOM_READ = 'DOM_READ',
  COMPUTATION = 'COMPUTATION',
  DOM_WRITE = 'DOM_WRITE',
  FUTURE = 'FUTURE'
}

const ORDER = [
  TASK.DOM_READ,
  TASK.COMPUTATION,
  TASK.DOM_WRITE,
]

type Tasks = {
  [value in TASK]: Task[]
}

const tasks: Tasks = {
  [TASK.DOM_READ]: [],
  [TASK.COMPUTATION]: [],
  [TASK.DOM_WRITE]: [],
  [TASK.FUTURE]: [],
}

function render () {
  // console.log('-----------------------------')
  // console.log('FRAME START')
  queue.phase = RENDERING
  for (const order of ORDER) {
    for (const task of tasks[order]) {
      if (!task.cancelled) {
        task.execute()
        task.completed = true
      }
    }
    tasks[order] = []
  }
  renderFrameId = undefined
  if (tasks[TASK.FUTURE].length) {
    tasks[TASK.DOM_WRITE] = tasks[TASK.FUTURE]
    tasks[TASK.FUTURE] = []
    scheduleRender()
  }
  queue.phase = INTERACTING
  // console.log('FRAME END')
  // console.log('-----------------------------')

}

interface Task {
  completed: boolean
  cancelled: boolean
  execute: () => void
}

function createTask (callback: () => void): Task {
  return {
    completed: false,
    cancelled: false,
    execute: callback,
  }
}

function scheduleTask (callback: () => void, order = TASK.DOM_WRITE) {
  const task = createTask(callback)
  tasks[order].push(task)
  scheduleRender()
  return task
}


