import { observable } from './observable'

test('set', () => {
  const o = observable(0)
  expect(o.get()).toStrictEqual(0)
  o.set(1)
  expect(o.get()).toStrictEqual(1)
})

test('observe', () => {
  const o = observable(0)
  const values = []
  const unobserve = o.observe((n) => values.push(n))
  o.set(4)
  expect(values).toStrictEqual([4])
  o.set(5)
  o.set(8)
  expect(values).toStrictEqual([4, 5, 8])
  unobserve()
  o.set(9)
  expect(values).toStrictEqual([4, 5, 8])
})

test('observe is not called when setting same value', () => {
  const o = observable(0)
  let called = 0
  o.observe(() => called++)
  o.set(0)
  expect(called).toStrictEqual(0)
  o.set(1)
  expect(called).toStrictEqual(1)
  o.set(1)
  expect(called).toStrictEqual(1)
})

test('Calling unobserve multiple times', () => {
  const o = observable(0)
  const values = []
  const unobserve1 = o.observe((n) => values.push(n))
  const unobserve2 = o.observe((n) => values.push(n * 2))
  o.set(1)
  expect(values).toStrictEqual([1, 2])
  unobserve1()
  unobserve1()
  o.set(2)
  expect(values).toStrictEqual([1, 2, 4])
})