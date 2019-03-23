// For IE11
Array.prototype.find = Array.prototype.find || function (predicate) {
  for (var i = 0; i < this.length; i++) {
    if (predicate(this[i], i, this)) return this[i]
  }
}

Object.assign = Object.assign || function (target) {
  var sources = Array.prototype.slice.call(arguments).slice(1)
  sources.forEach(function (source) {
    for (var key in source) {
      target[key] = source[key]
    }
  })
  return target
}

Number.isInteger = Number.isInteger || function (n) {
  return !(n % 1)
}

Object.values = Object.values || function (source) {
  var values = []
  for (var key in source) {
    values.push(source[key])
  }
  return values
}