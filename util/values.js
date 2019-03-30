export function values (source) {
  var values = []
  for (var key in source) {
    values.push(source[key])
  }
  return values
}