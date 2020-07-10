import { Lambda } from '../../types'

enum BATCH_STATE {
  NORMAL,
  BATCH,
}

export const GlobalState = {
  batchState: BATCH_STATE.NORMAL,
  taskQueue: [] as Lambda[],
  setBatchState (newState: BATCH_STATE) {
    this.batchState = newState
    if (this.batchState === BATCH_STATE.NORMAL) {
      for (const task of this.taskQueue) {
        task()
      }
      this.taskQueue = []
    }
  },
  enqueueTask (task: Lambda) {
    if (this.batchState === BATCH_STATE.NORMAL) {
      task()
    } else {
      this.taskQueue.push(task)
    }
  }
}

export function batch (operation: Lambda) {
  GlobalState.setBatchState(BATCH_STATE.BATCH)
  operation()
  GlobalState.setBatchState(BATCH_STATE.NORMAL)
}
