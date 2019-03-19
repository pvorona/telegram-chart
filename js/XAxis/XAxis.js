import { pow } from '../util'
import { VIEW_BOX_CHANGE } from '../events'
import { div } from '../html'

const LEGEND_ITEM_CLASS = 'legend-item-value'
const LEGEND_ITEM_HIDDEN_CLASS = 'legend-item-value--hidden'

export function XAxis ({ points, viewBox, width }) {
  const containerElement = div()
  containerElement.className = 'x-axis'
  containerElement.style.width = `${width}px`
  const shiftingContainer = div()
  shiftingContainer.className = 'shifting-container'
  containerElement.appendChild(shiftingContainer)
  const legendValues = []
  const valuesWidths = []

  for (let i = 0; i < points.length; i++) {
    const xValueElement = div()
    xValueElement.innerText = points[i].label
    xValueElement.className = LEGEND_ITEM_CLASS
    legendValues.push(xValueElement)
    shiftingContainer.appendChild(xValueElement)
  }

  reconcile()

  function reconcile () {
    const stepMiltiplier = calculateMultiplier(viewBox.endIndex - viewBox.startIndex)
    const xScale = (viewBox.endIndex - viewBox.startIndex) / (points.length - 1)
    const shift = -1 / xScale * width * viewBox.startIndex / (points.length - 1)
    shiftingContainer.style.transform = `translateX(${shift}px)`
    for (let i = 0; i < points.length; i++) {
      const xValueElement = legendValues[i]
      const offset = points[i].x / xScale
      xValueElement.style.transform = `translateX(${offset}px)`
      if (!valuesWidths[i]) {
        valuesWidths[i] = xValueElement.offsetWidth
      }
      xValueElement.classList.toggle(
        LEGEND_ITEM_HIDDEN_CLASS,
        i % pow(2, stepMiltiplier)
        || (offset < -1 * shift)
        || (valuesWidths[i] + offset + shift > width)
      )
    }
  }

  return {
    element: containerElement,
    update
  }

  function update ({ type }) {
    if (type === VIEW_BOX_CHANGE) {
      reconcile()
    }
  }
}

function calculateMultiplier (n) {
  for (let i = 3; i < 50; i++) {
    if (n < pow(2,i)) return i - 3
  }
}