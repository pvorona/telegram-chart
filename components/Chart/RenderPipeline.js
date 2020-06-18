var renderFrameId = undefined

function scheduleRender () {
  if (renderFrameId) return
  renderFrameId = requestAnimationFrame(render)
}

let rafTasks = []

function render () {
  rafTasks.forEach(task => {
    task.execute()
    task.completed = true
  })
  rafTasks = []
  renderFrameId = undefined
}

function scheduleTask (callback) {
  const task = {
    completed: false,
    execute: callback,
  }
  rafTasks.push(task)
  scheduleRender()
  return task
}

export function smartObserve (
  deps,
  observer,
) {
  let task = undefined
  scheduleNotify()

  const unobserves = deps.map(dep => dep.observe(scheduleNotify))

  function scheduleNotify () {
    if (!task || task.completed) {
      task = scheduleTask(notify)
    }
  }

  function notify () {
    return observer(...deps.map(dep => dep.get()))
  }

  return () => {
    unobserves.forEach(unobserve => unobserve())
  }
}