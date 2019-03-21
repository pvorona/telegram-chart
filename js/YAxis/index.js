import './YAxis.css'

const STEP_COUNT = 5

export function YAxis (max, height) {
  const element = document.createDocumentFragment()

  console.log(height)
  const step = height / STEP_COUNT
  for (let i = 0; i < STEP_COUNT; i++) {
    const line = document.createElement('div')
    line.className = 'y-axis-line'
    line.style.bottom = `${step * i}px`
    element.appendChild(line)
  }

  return { element }
}

function calculateVisibleLines (max) {
  return Math.round(max / 5)
}