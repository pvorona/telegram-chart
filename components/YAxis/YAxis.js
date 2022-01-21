import { getShortNumber, calculateLogScaleMultiplier } from '../../util'

const CLASS = 'y-axis-line'
const NUMBER_CLASS = 'y-axis-number'
const STEP_COUNT = 4
const NUMBER_VERTICAL_PADDING = 5
const NUMBER_VERTICAL_SPACE = 18

export function YAxis (max, min, height) {
  const element = document.createDocumentFragment()
  const elements = []

  const totalStepCount = max / min * STEP_COUNT
  const step = height / totalStepCount
  for (let i = 0; i < totalStepCount; i++) {
    const line = document.createElement('div')
    line.className = CLASS

    const number = document.createElement('div')
    number.className = NUMBER_CLASS
    number.innerText = getShortNumber(Math.round(max / totalStepCount * i))
    elements.push({
      line: line,
      number: number,
      bottom: step * i,
    })

    element.appendChild(number)
    element.appendChild(line)
  }

  setMax(max)

  return { element, setMax }

  // This function need to be optimized for data with big range of values
  function setMax (newMax) {
    const numberOfVisibleSteps = elements.reduce(
      (total, element) => total + (max / newMax * element.bottom + NUMBER_VERTICAL_PADDING + NUMBER_VERTICAL_SPACE <= height),
      0,
    )
    const multiplier = calculateLogScaleMultiplier(numberOfVisibleSteps) + Number(height <= 250)
    elements.forEach((element, index) => {
      const y = max / newMax * element.bottom

      element.line.style.transform = `translateY(${-1 * y}px)`
      element.number.style.transform = `translateY(${-1 * (y + NUMBER_VERTICAL_PADDING)}px)`
      const isVisible = y + NUMBER_VERTICAL_PADDING + NUMBER_VERTICAL_SPACE <= height && !(index % Math.pow(2, multiplier))
      if (isVisible) {
        element.line.style.opacity = 1
        element.number.style.opacity = 1
      } else {
        element.line.style.opacity = 0
        element.number.style.opacity = 0
      }
    })
  }
}
