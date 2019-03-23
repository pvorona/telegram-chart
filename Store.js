import { EventChannel } from './EventChannel'

export function Store (initialState, reducer, selectors) {
  this.eventChannel = new EventChannel()
  this.state = initialState
  for (const selectorName in selectors) {
    Object.defineProperty(this.state, selectorName, {
      get: selectors[selectorName].bind(undefined, this.state)
    })
  }
  this.reducer = reducer
}

Store.prototype.subscribe = function (event, listener) {
  this.eventChannel.subscribe(event, listener)
}

Store.prototype.publish = function (event, payload) {
  this.updateState(event, payload)
  this.eventChannel.publish(event, payload)
}

Store.prototype.updateState = function (event, payload) {
  this.reducer(this.state, event, payload)
}
