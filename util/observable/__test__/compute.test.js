import { compute } from '../compute'
import { observable } from '../observable'

test('compute is called immediately', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  compute([o1, o2], (o1, o2) => calls.push([o1, o2]))
  expect(calls).toStrictEqual([[1, 2]])
})

test('compute is called on any dependency change', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  compute([o1, o2], (o1, o2) => calls.push([o1, o2]))

  o1.set(3)
  o2.set(4)

  expect(calls).toStrictEqual([[1, 2], [3, 2], [3, 4]])
})

test('compute is not called when .get is called and return last value', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  const c = compute([o1, o2], (o1, o2) => {
    calls.push([o1, o2])
    return [o1, o2]
  })

  expect(c.get()).toStrictEqual([1, 2])
  expect(calls).toStrictEqual([[1, 2]])
})

test('compute is not called after unobserve is called', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  const c = compute([o1, o2], (o1, o2) => [o1, o2])

  const unobserve = c.observe(([o1, o2]) => calls.push([o1, o2]))

  o1.set(3)

  unobserve()

  o2.set(4)

  expect(calls).toStrictEqual([[3, 2]])
})