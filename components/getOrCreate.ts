export function getOrCreate <Key extends string | number, Value> (
  source: { [key in Key]: Value },
  key: Key,
  create: (key: Key) => Value,
) {
  if (!(key in source)) {
    source[key] = create(key)
  }
  return source[key]
}