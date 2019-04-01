import { values } from './values'

export const linear = t => t
export function easing (t) {
  return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

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

export function createTransitionGroup (initialValues, durations, easings, onTick) {
  const currentState = { ...initialValues }
  const currentTargets = { ...initialValues }
  const animations = {}

  const setTargets = (targets) => {
    for (let key in targets) {
      const value = targets[key]

      if (currentTargets[key] === value || currentState[key] === value) {
        continue
      }

      currentTargets[key] = value

      if (animations[key]) {
        animations[key]()
      }
      animations[key] = animate(currentState[key], value, durations[key], easings[key], (newValue) => {
        currentState[key] = newValue
        onTick(currentState)
      })
    }
  }

  return { setTargets }
}
