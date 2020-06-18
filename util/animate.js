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

export function animationObservable (transition) {
  const observers = []
  let animationId = undefined
  let lastDispatchedState = {}
  let state = transition.getState()

  function notify () {
    observers.forEach(observer => observer(state))
  }

  const scheduleUpdate = () => {
    if (animationId === undefined) {
      animationId = requestAnimationFrame(handleAnimationFrame)
    }
  }

  const get = () => {
    return state
  }

  const handleAnimationFrame = () => {
    animationId = undefined

    if (!transition.isFinished()) {
      scheduleUpdate()
    }

    const newState = transition.getState()
    if (state !== newState) {
      state = newState
      notify()
    }
  }

  const set = target => {
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
    set,
    get,
    observe (observer) {
      observers.push(observer)
    },
  }
}