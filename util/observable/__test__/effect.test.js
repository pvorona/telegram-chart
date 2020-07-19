import { effect } from '../effect'
import { observable } from '../observable'

test('schedules effect execution immediately', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  effect([o1, o2], (o1, o2) => calls.push([o1, o2]))
  expect(calls).toStrictEqual([[1, 2]])
})

// - schedules effect execution immediately
// - does not fire after unobserve is called
// - Schedules notification each time any dependency changes by calling all dependencie's .get()
