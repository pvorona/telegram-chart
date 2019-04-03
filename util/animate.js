import { values } from './values'

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
    // every transition calls date.now
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

export function createTransitionGroup (transitions, onTick) {
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
    if (!statesEqual(state, lastDispatchedState)) {
      lastDispatchedState = state
      onTick(state)
    }
  }

  const setTargets = targets => {
    for (let key in targets) {
      // Do i need this condition?
      if (key in transitions) {
        transitions[key].setTarget(targets[key])

        if (!transitions[key].isFinished()) {
          // handleAnimationFrame()
          scheduleUpdate()
        }
      }
    }
  }

  return { setTargets }
}

function statesEqual (a, b) {
  for (let key in a) {
    if (a[key] !== b[key]) return false
  }
  return true
}