import { effect } from '../effect'
import { observable } from '../observable'

class Scheduler {
  queue = []

  execute = () => {
    this.queue.forEach(task => task())
    this.queue = []
  }
  scheduleEffect = (effect) => {
    return () => {
      this.queue.push(effect)
    }
  }
}

test('schedules effect execution immediately', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  effect(
    [o1, o2],
    (o1, o2) => calls.push([o1, o2]),
    (task) => () => task(),
  )
  expect(calls).toStrictEqual([[1, 2]])
})

test('Schedules notification each time any dependency changes by calling all dependencies .get()', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  effect(
    [o1, o2],
    (o1, o2) => calls.push([o1, o2]),
    (task) => () => task(),
  )
  expect(calls).toStrictEqual([[1, 2]])
  o1.set(3)
  expect(calls).toStrictEqual([[1, 2], [3, 2]])
  o2.set(4)
  expect(calls).toStrictEqual([[1, 2], [3, 2], [3, 4]])
})

test('does not fire after unobserve is called', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  const unobserve = effect(
    [o1, o2],
    (o1, o2) => calls.push([o1, o2]),
    (task) => () => task(),
  )
  expect(calls).toStrictEqual([[1, 2]])
  unobserve()
  o1.set(3)
  o2.set(4)
  expect(calls).toStrictEqual([[1, 2]])
})

test('executes all scheduled tasks when performing effect', () => {
  const o1 = observable(1)
  const o2 = observable(2)

  const calls = []

  const scheduller = new Scheduler

  effect(
    [o1, o2],
    (o1, o2) => calls.push([o1, o2]),
    scheduller.scheduleEffect,
  )

  expect(calls).toStrictEqual([])
  scheduller.execute()
  expect(calls).toStrictEqual([[1, 2]])
  o1.set(3)
  o2.set(4)
  o1.set(5)
  o1.set(6)
  expect(calls).toStrictEqual([[1, 2]])
  scheduller.execute()
  expect(calls).toStrictEqual([[1, 2], [6, 4]])
})

