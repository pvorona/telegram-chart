import { shallowEqual } from './shallowEqual'
import { values } from './values'

export interface Transition <A> {
  getState: () => A
  setTarget: (target: A) => void
  setImmediate: (t: A) => void
  getTarget: () => A
  isFinished: () => boolean
}

export type Easing = (progress: number) => number

export function transition (
  initialValue: number,
  duration: number,
  easing: Easing,
): Transition <number> {
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

  const setTarget = (target: number) => {
    if (target === targetValue) {
      return
    }

    startValue = getState()
    targetValue = target
    finished = false
    startTime = performance.now() + performance.timing.navigationStart
  }

  function getTarget () {
    return targetValue
  }

  function setImmediate (t: number) {
    targetValue = t
    finished = true
  }

  return {
    getState,
    isFinished,
    setTarget,
    getTarget,
    setImmediate,
  }
}

export function groupTransition (
  transitions: { [key: string]: Transition<number> }
): Transition<{ [key: string]: number }> {
  let state = computeState()

  function computeState () {
    const newState: { [key: string]: any } = {}
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

  function setTarget (target: { [key: string]: number }) {
    for (const key in target) {
      transitions[key].setTarget(target[key])
    }
  }

  function isFinished () {
    return values(transitions).every(transition => transition.isFinished())
  }

  function getTarget () {
    const result: { [key: string]: number } = {}
    for (const key in transitions) {
      result[key] = transitions[key].getTarget()
    }
    return result
  }

  function setImmediate () {}

  return {
    setImmediate,
    setTarget,
    isFinished,
    getState,
    getTarget,
  }
}
