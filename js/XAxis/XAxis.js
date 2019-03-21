import { pow } from '../util'
import { div } from '../html'

const LEGEND_ITEM_CLASS = 'legend-item-value'
const LEGEND_ITEM_HIDDEN_CLASS = 'legend-item-value--hidden'
const APPROX_LABEL_WIDTH = 40

export function XAxis ({ points, viewBox, width }) {
  const element = div()
  element.className = 'x-axis'
  element.style.width = `${width}px`
  const shiftingContainer = div()
  shiftingContainer.className = 'shifting-container'
  element.appendChild(shiftingContainer)
  const legendValues = []
  const valuesWidths = []

  for (let i = 0; i < points.length; i++) {
    const xValueElement = div()
    xValueElement.innerText = points[i].label
    xValueElement.className = LEGEND_ITEM_CLASS
    legendValues.push(xValueElement)
    shiftingContainer.appendChild(xValueElement)
  }

  setViewBox(viewBox)

  return { element, setViewBox }

  function setViewBox (viewBox) {
    const stepMiltiplier = calculateMultiplier(viewBox.endIndex - viewBox.startIndex)
    const xScale = (viewBox.endIndex - viewBox.startIndex) / (points.length - 1)
    const shift = -1 / xScale * width * viewBox.startIndex / (points.length - 1)
    shiftingContainer.style.transform = `translateX(${shift}px)`
    for (let i = 0; i < points.length; i++) {
      const xValueElement = legendValues[i]
      const offset = points[i].x / xScale
      xValueElement.style.transform = `translateX(${offset}px)`
      if (!valuesWidths[i]) {
        valuesWidths[i] = xValueElement.offsetWidth || APPROX_LABEL_WIDTH
      }
      xValueElement.classList.toggle(
        LEGEND_ITEM_HIDDEN_CLASS,
        i % pow(2, stepMiltiplier)
        || (offset < -1 * shift)
        || (valuesWidths[i] + offset + shift > width)
      )
    }
  }
}

function calculateMultiplier (n) {
  for (let i = 3; i < 50; i++) {
    if (n < pow(2,i)) return i - 3
  }
}