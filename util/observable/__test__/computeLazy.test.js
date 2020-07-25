import { computeLazy } from '../computeLazy'
import { observable } from '../observable'

// observers are called with no values
//lazy of lazy

test('compute is not called immediately', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  computeLazy([o1, o2], (o1, o2) => {
    calls.push([o1, o2])
  })
  expect(calls).toStrictEqual([])
})

test('compute is called when calling .get() and cached', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  const c = computeLazy([o1, o2], (o1, o2) => {
    calls.push([o1, o2])
    return [o1, o2]
  })

  expect(c.get()).toStrictEqual([1, 2])
  expect(c.get()).toStrictEqual([1, 2])
  expect(c.get()).toStrictEqual([1, 2])
  expect(calls).toStrictEqual([[1, 2]])
})

test('compute is not called on any dependency change', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  computeLazy([o1, o2], (o1, o2) => calls.push([o1, o2]))

  o1.set(3)
  o2.set(4)

  expect(calls).toStrictEqual([])
})

test('compute is called when calling .get() after any dependency change', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  const c = computeLazy([o1, o2], (o1, o2) => {
    calls.push([o1, o2])
    return [o1, o2]
  })

  expect(c.get()).toStrictEqual([1, 2])

  o1.set(3)
  o2.set(4)

  expect(c.get()).toStrictEqual([3, 4])
  expect(c.get()).toStrictEqual([3, 4])
  expect(c.get()).toStrictEqual([3, 4])
  expect(calls).toStrictEqual([[1, 2], [3, 4]])
})

test('compute is not called after unobserve is called', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  let calls = 0

  const c = computeLazy([o1, o2], (o1, o2) => {})

  const unobserve = c.observe(() => calls += 1)

  expect(calls).toStrictEqual(0)

  o1.set(3)

  expect(calls).toStrictEqual(1)

  unobserve()

  o2.set(4)

  expect(calls).toStrictEqual(1)
})