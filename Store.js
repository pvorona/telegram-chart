import { EventChannel } from './EventChannel'

export function Store (initialState, reducer) {
  this.eventChannel = new EventChannel()
  this.state = initialState
  this.reducer = reducer
  console.log(initialState)
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
  console.log(this.state)
}
