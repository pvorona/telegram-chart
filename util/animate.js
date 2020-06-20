import { values } from './values'
import { shallowEqual } from './shallowEqual'

export function animate (from, to, duration, easing, callback) {
  const startAnimationTime = performance.now() + performance.timing.navigationStart
  let lastDispatchedValue = from
  let animating = true
  let animationId

  function frame (currentTime) {
    if (currentTime - startAnimationTime >= duration) {
      if (lastDispatchedValue !== to) {
        callback(to)
      }
      animating = false
    } else {
      const currentValue = easing(
        (currentTime - startAnimationTime) / duration
      ) * (to - from) + from
      callback(currentValue)
      lastDispatchedValue = currentValue
      animationId = requestAnimationFrame(frame)
    }
  }
  animationId = requestAnimationFrame(frame)

  return function cancelAnimation () {
    if (animating) {
      const currentTime = performance.now() + performance.timing.navigationStart
      callback(easing(
        (currentTime - startAnimationTime) / duration
      ) * (to - from) + from)
      cancelAnimationFrame(animationId)
    }
  }
}

export function transition (initialValue, duration, easing) {
  let startTime = performance.now() + performance.timing.navigationStart
  let startValue = initialValue
  let targetValue = initialValue
  let finished = true

  const getState = () => {
    const progress = Math.min((performance.now() + performance.timing.navigationStart - startTime) / duration, 1)

    if (progress === 1) {
      finished = true
    }
    return startValue + (targetValue - startValue) * easing(progress)
  }

  const isFinished = () => finished

  const setTarget = (target) => {
    if (target === targetValue) {
      return
    }

    startValue = getState()
    targetValue = target
    finished = false
    startTime = performance.now() + performance.timing.navigationStart
  }

  return {
    getState,
    isFinished,
    setTarget,
  }
}

export function animation (transition, onFrame) {
  let animationId = undefined
  let lastDispatchedState = {}
  let state = transition.getState()

  const scheduleUpdate = () => {
    if (animationId === undefined) {
      animationId = requestAnimationFrame(handleAnimationFrame)
    }
  }

  const getState = () => {
    return state
  }

  const handleAnimationFrame = () => {
    animationId = undefined

    if (!transition.isFinished()) {
      scheduleUpdate()
    }

    const newState = transition.getState()
    if (!shallowEqual(newState, state)) {
      state = newState
      onFrame(state)
    }
  }

  const setTarget = target => {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = undefined
    }
    let shouldAnimate = false

    transition.setTarget(target)

    if (!transition.isFinished()) {
      scheduleUpdate()
    }
  }

  return {
    setTarget,
    getState,
  }
}

export function groupTransition (transitions) {
  let state = computeState()

  function computeState () {
    const newState = {}
    for (const key in transitions) {
      newState[key] = transitions[key].getState()
    }
    return newState
  }

  function getState () {
    const newState = computeState()
    if (shallowEqual(state, newState)) {
      // Preserve referential transparency for selectors
      return state
    }
    state = newState
    return state
  }

  function setTarget (target) {
    for (const key in target) {
      transitions[key].setTarget(target[key])
    }
  }

  function isFinished () {
    return values(transitions).every(transition => transition.isFinished())
  }

  return { setTarget, isFinished, getState }
}

const INTERACTING = 'INTERACTING'
const RENDERING = 'RENDERING'
const queue = {
  phase: INTERACTING
}


function oncePerFrame (original, priority = TASK.DOM_WRITE) {
  let task = undefined

  return function wrapperEffect () {
    if (task === undefined || task.completed || task.cancelled) {
      task = scheduleTask(original, priority)
    }
  }
}

function computation (compute, name) {
  let task = undefined

  function wrappedComputation () {
    if (queue.phase === RENDERING) {
      compute()
    } else {
      if (task === undefined || task.completed || task.cancelled) {
        task = scheduleTask(compute, TASK.COMPUTATION)
      }
    }
  }

  if (name) {
    // wrappedComputation.name = `${wrappedComputation.name}(${name})`
  }

  return wrappedComputation
}

export function animationObservable (transition) {
  const observers = []
  let state = transition.getState()

  function notify () {
    observers.forEach(observer => observer(state))
  }

  const get = () => {
    return state
  }

  const handleAnimationFrame = oncePerFrame(function onFrame () {
    const newState = transition.getState()
    if (state !== newState) {
      state = newState
      notify()
    }

    if (!transition.isFinished()) {
      return onFrame
    }
  }, TASK.COMPUTATION)

  const set = target => {
    // might need cancel task here
    transition.setTarget(target)

    if (!transition.isFinished()) {
      handleAnimationFrame()
    }
  }

  return {
    set,
    get,
    observe (observer) {
      observers.push(observer)
    },
  }
}

function cancelTask (task) {
  task.cancelled = true
}

var renderFrameId = undefined

function scheduleRender () {
  if (renderFrameId) return
  renderFrameId = requestAnimationFrame(render)
}

const TASK = {
  DOM_READ: 0,
  COMPUTATION: 1,
  DOM_WRITE: 2,
}

const ORDER = [
  TASK.DOM_READ,
  TASK.COMPUTATION,
  TASK.DOM_WRITE,
]

const tasks = {
  [TASK.DOM_READ]: [],
  [TASK.COMPUTATION]: [],
  [TASK.DOM_WRITE]: [],
}

function render () {
  console.log('-----------------------------')
  console.log('FRAME START')
  queue.phase = RENDERING
  let shouldRequestRender = false
  for (const order of ORDER) {
    queue.order = order
    const producedTasks = []
    for (const task of tasks[order]) {
      if (!task.cancelled) {
        const producedTask = task.execute()
        task.completed = true
        if (typeof producedTask === 'function') {
          producedTasks.push(createTask(producedTask))
          shouldRequestRender = true
        }
      }
    }
    tasks[order] = producedTasks
  }
  renderFrameId = undefined
  if (shouldRequestRender) {
    scheduleRender()
  }
  queue.phase = INTERACTING
  console.log('FRAME END')
  console.log('-----------------------------')

}

function createTask (callback) {
  return {
    completed: false,
    cancelled: false,
    execute: callback,
  }
}

function scheduleTask (callback, order = TASK.DOM_WRITE) {
  const task = createTask(callback)
  tasks[order].push(task)
  scheduleRender()
  return task
}

export function effect (
  deps,
  observer,
) {
  const notify = oncePerFrame(() => observer(...deps.map(dep => dep.get())), TASK.DOM_WRITE)
  const unobserves = deps.map(dep => dep.observe(notify))

  notify()

  return () => {
    unobserves.forEach(unobserve => unobserve())
  }
}

export function compute (
  deps,
  compute,
  name,
) {
  const obs = observable(recompute())
  const wrapperNotifyComputationObservers = computation(function notifyComputationObservers () {
    obs.set(recompute())
  }, name)

  const unobserves = deps.map(dep => dep.observe(wrapperNotifyComputationObservers))


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

export function observable (initialValue) {
  let value = initialValue
  const observers = []

  function notify () {
    observers.forEach(observer => observer(value))
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
  }
}

export function observe (
  deps,
  observer,
) {
  notify()

  const unobserves = deps.map(dep => dep.observe(notify))

  function notify () {
    return observer(...deps.map(dep => dep.get()))
  }

  return () => {
    unobserves.forEach(unobserve => unobserve())
  }
}