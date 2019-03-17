import { EVENTS } from './constants'

const LEGEND_ITEM_CLASS = 'legend-item-value'
const LEGEND_ITEM_HIDDEN_CLASS = 'legend-item-value--hidden'

export function XAxis ({ points, viewBox, width }) {
  const containerElement = document.createElement('div')
  containerElement.className = 'x-axis'
  containerElement.style.width = `${width}px`
  const shiftingContainer = document.createElement('div')
  shiftingContainer.classList.add('shifting-container')
  containerElement.appendChild(shiftingContainer)
  const legendValues = []

  for (let i = 0; i < points.length; i++) {
    const xValueElement = document.createElement('div')
    xValueElement.textContent = points[i].label
    xValueElement.classList.add(LEGEND_ITEM_CLASS)
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
      // Performance!
      xValueElement.classList.toggle(
        LEGEND_ITEM_HIDDEN_CLASS,
        i % Math.pow(2, stepMiltiplier)
        || (offset < -1 * shift)
        || (xValueElement.offsetWidth + offset + shift > width)
      )
    }
  }

  return [containerElement, update]

  function update ({ type }) {
    if (type === EVENTS.VIEW_BOX_CHANGE) {
      reconcile()
    }
  }
}

// Not smart enough to find analytic representation for this function
function calculateMultiplier (size) {
    if      (size < Math.pow(2, 3)) return 0
    else if (size < Math.pow(2, 4)) return 1
    else if (size < Math.pow(2, 5)) return 2
    else if (size < Math.pow(2, 6)) return 3
    else if (size < Math.pow(2, 7)) return 4
    else if (size < Math.pow(2, 8)) return 5
    else if (size < Math.pow(2, 9)) return 6
    else if (size < Math.pow(2, 10)) return 7
    else if (size < Math.pow(2, 11)) return 8
    else if (size < Math.pow(2, 12)) return 9
    else if (size < Math.pow(2, 13)) return 10
}
