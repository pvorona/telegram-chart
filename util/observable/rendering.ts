import { Lambda } from '../../types'

const INTERACTING = 'INTERACTING'
const RENDERING = 'RENDERING'
const queue = {
  phase: INTERACTING
}

export function performEffect (original: Lambda): Lambda {
// export function performEffect (original: Lambda, priority = TASK.DOM_WRITE): Lambda {
  let task: Task

  return function wrappedEffect () {
    if (task === undefined || task.completed || task.cancelled) {
      task = scheduleTask(original)
      // task = scheduleTask(original, priority)
    }
  }
}

// function computation (compute: () => void): () => void {
//   let task: Task

//   function wrappedComputation () {
//     if (queue.phase === RENDERING) {
//       compute()
//     } else {
//       if (task === undefined || task.completed || task.cancelled) {
//         task = scheduleTask(compute, TASK.COMPUTATION)
//       }
//     }
//   }

//   return wrappedComputation
// }

var renderFrameId: undefined | number = undefined

function scheduleRender () {
  if (renderFrameId) return
  renderFrameId = requestAnimationFrame(render)
}

export enum TASK {
  DOM_READ = 'DOM_READ',
  COMPUTATION = 'COMPUTATION',
  DOM_WRITE = 'DOM_WRITE',
  FUTURE = 'FUTURE'
}

const ORDER = [
  TASK.DOM_READ,
  TASK.COMPUTATION,
  TASK.DOM_WRITE,
]

type Tasks = {
  [value in TASK]: Task[]
}

export const tasks: Tasks = {
  [TASK.DOM_READ]: [],
  [TASK.COMPUTATION]: [],
  [TASK.DOM_WRITE]: [],
  [TASK.FUTURE]: [],
}

function render () {
  // console.log('-----------------------------')
  // console.log('FRAME START')
  queue.phase = RENDERING
  for (const order of ORDER) {
    for (const task of tasks[order]) {
      if (!task.cancelled) {
        task.execute()
        task.completed = true
      }
    }
    tasks[order] = []
  }
  renderFrameId = undefined
  if (tasks[TASK.FUTURE].length) {
    tasks[TASK.DOM_WRITE] = tasks[TASK.FUTURE]
    tasks[TASK.FUTURE] = []
    scheduleRender()
  }
  queue.phase = INTERACTING
  // console.log('FRAME END')
  // console.log('-----------------------------')

}

export interface Task {
  completed: boolean
  cancelled: boolean
  execute: () => void
}

export function createTask (callback: () => void): Task {
  return {
    completed: false,
    cancelled: false,
    execute: callback,
  }
}

function scheduleTask (callback: () => void, order = TASK.DOM_WRITE) {
  const task = createTask(callback)
  tasks[order].push(task)
  scheduleRender()
  return task
}
