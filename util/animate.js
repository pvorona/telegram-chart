import { values } from './values'
import { shallowEqual } from './shallowEqual'

export function animate (from, to, duration, easing, callback) {
  const startAnimationTime = Date.now()
  let lastDispatchedValue = from
  let animating = true
  let animationId

  function frame () {
    const currentTime = Date.now()
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
      const currentTime = Date.now()
      callback(easing(
        (currentTime - startAnimationTime) / duration
      ) * (to - from) + from)
      cancelAnimationFrame(animationId)
    }
  }
}

export function transition (initialValue, duration, easing) {
  let startTime = Date.now()
  let startValue = initialValue
  let targetValue = initialValue
  let finished = true

  const getState = () => {
    const progress = Math.min((Date.now() - startTime) / duration, 1)

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
    startTime = Date.now()
  }

  return {
    getState,
    isFinished,
    setTarget,
  }
}

export function createTransitionGroup (transitions, onFrame) {
  let animationId = undefined
  let lastDispatchedState = {}

  for (let key in transitions) {
    lastDispatchedState[key] = transitions[key].value
  }

  const scheduleUpdate = () => {
    if (animationId === undefined) {
      animationId = requestAnimationFrame(handleAnimationFrame)
    }
  }

  const getState = () => {
    const state = {}
    for (let key in transitions) {
      state[key] = transitions[key].getState()
    }
    return state
  }

  const handleAnimationFrame = () => {
    animationId = undefined
    const allTransitionsFinished = values(transitions).every(transition => transition.isFinished())

    if (!allTransitionsFinished) {
      scheduleUpdate()
    }

    const state = getState()
    if (!shallowEqual(state, lastDispatchedState)) {
      lastDispatchedState = state
      onFrame(state)
    }
  }

  const setTargets = targets => {
    if (animationId) {
      animationId = undefined
      cancelAnimationFrame(animationId)
    }
    let shouldAnimate = false

    for (let key in targets) {
      transitions[key].setTarget(targets[key])

      if (!transitions[key].isFinished()) {
        shouldAnimate = true
      }
    }

    if (shouldAnimate) {
      handleAnimationFrame()
    }
  }

  return { setTargets }
}