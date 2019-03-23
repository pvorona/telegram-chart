import { TOGGLE_VISIBILITY_STATE } from '../events'

export function EmptyState (store) {
  store.subscribe(TOGGLE_VISIBILITY_STATE, toggleVisibility)

  const element = document.createElement('div')
  element.className = 'empty-state'
  element.innerText = 'Nothing to show'
  element.style.opacity = 0

  return { element }

  function toggleVisibility () {
    element.style.opacity = store.state.hasVisibleGraphNames ? 0 : 1
  }
}