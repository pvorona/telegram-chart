export function EventChannel () {
  this.listeners = []
}

EventChannel.prototype.publish = function (event, payload) {
  this.listeners
    .filter(listener => listener.event === event)
    .forEach(listener => listener.callback(payload))
}

EventChannel.prototype.subscribe = function (event, listener) {
  this.listeners.push({
    event,
    callback: listener,
  })
}

