export function getOrCreate<Key extends string | number, Value>(
  source: { [key in Key]: Value },
  key: Key,
  create: (key: Key) => Value
) {
  if (!(key in source)) {
    source[key] = create(key);
  }
  return source[key];
}

type Cache<Key extends string | number, Value> = { get: (key: Key) => Value };

export function createCache<Key extends string | number, Value>(
  create: (key: Key) => Value
): Cache<Key, Value> {
  const cache = {} as Record<Key, Value>;

  return {
    get: (key: Key) => getOrCreate(cache, key, create),
  };
}
