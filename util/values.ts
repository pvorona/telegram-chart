export function values (source: { [key: string]: any }) {
  var values = []
  for (var key in source) {
    values.push(source[key])
  }
  return values
}