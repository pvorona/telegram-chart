import { TOGGLE_VISIBILITY_STATE, VIEW_BOX_CHANGE } from './components/events'

function createReducer (reducer) {
  return function (state, event, payload) {
    reducer[event](state, payload)
  }
}

export const reducer = createReducer({
  [TOGGLE_VISIBILITY_STATE]: (state, graphName) => {
    state.visibilityState[graphName] = !state.visibilityState[graphName]
  }
})
