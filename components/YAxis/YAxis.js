import { getShortNumber } from '../../util'

const CLASS = 'y-axis-line'
const NUMBER_CLASS = 'y-axis-number'
const STEP_COUNT = 5
const NUMBER_VERTICAL_PADDING = 5
const NUMBER_VERTICAL_SPACE = 18

export function YAxis (max, height) {
  const element = document.createDocumentFragment()
  const elements = []

  const step = height / STEP_COUNT
  for (let i = 0; i < STEP_COUNT; i++) {
    const line = document.createElement('div')
    line.className = CLASS
    line.style.transform = `translateY(${-step * i}px)`

    const number = document.createElement('div')
    number.className = NUMBER_CLASS
    number.innerText = getShortNumber(max / STEP_COUNT * i)
    number.style.transform = `translateY(${-step * i - NUMBER_VERTICAL_PADDING}px)`
    elements.push({
      line: line,
      number: number,
      bottom: step * i,
    })

    element.appendChild(number)
    element.appendChild(line)
  }

  return { element, setMax }

  function setMax (newMax) {
    elements.forEach(element => {
      const y = max / newMax * element.bottom

      element.line.style.transform = `translateY(${-1 * y}px)`
      element.number.style.transform = `translateY(${-1 * (y + NUMBER_VERTICAL_PADDING)}px)`
      if (y + NUMBER_VERTICAL_PADDING + NUMBER_VERTICAL_SPACE >= height) {
        element.line.style.opacity = 0
        element.number.style.opacity = 0
      } else {
        element.line.style.opacity = 1
        element.number.style.opacity = 1
      }
    })
  }
}
