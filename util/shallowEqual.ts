export function shallowEqual (a: { [key: string]: any }, b: { [key: string]: any }) {
  for (let key in a) {
    if (a[key] !== b[key]) return false
  }
  return true
}