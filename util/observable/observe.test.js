import { observe, observable } from './observable'

test('fires immediately', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  observe([o1, o2], (o1, o2) => calls.push([o1, o2]))
  expect(calls).toStrictEqual([[1, 2]])
})

test('fires after any input change', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  observe([o1, o2], (o1, o2) => calls.push([o1, o2]))

  o1.set(3)
  o2.set(4)

  expect(calls).toStrictEqual([[1, 2], [3, 2], [3, 4]])
})

test('does not fire after unobserving', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  const unobserve = observe([o1, o2], (o1, o2) => calls.push([o1, o2]))

  unobserve()

  o1.set(3)
  o2.set(4)

  expect(calls).toStrictEqual([[1, 2]])

})