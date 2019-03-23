import { pow } from '../../util'
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
  const visibilityState = {}
  const scheduledToHide = {}

  shiftingContainer.addEventListener('transitionend', onTransitionEnd)

  for (let i = 0; i < points.length; i++) {
    const xValueElement = div()
    xValueElement.innerText = points[i].label
    xValueElement.className = LEGEND_ITEM_CLASS
    legendValues.push(xValueElement)
    shiftingContainer.appendChild(xValueElement)
  }

  setViewBox(viewBox)

  return { element, setViewBox }

  function onTransitionEnd (e) {
    const elementIndex = legendValues.indexOf(e.target)
    scheduledToHide[elementIndex] = false
  }

  function setViewBox (viewBox) {
    const stepMiltiplier = calculateMultiplier(viewBox.endIndex - viewBox.startIndex)
    const xScale = (viewBox.endIndex - viewBox.startIndex) / (points.length - 1)
    const shift = -1 / xScale * width * viewBox.startIndex / (points.length - 1)
    shiftingContainer.style.transform = `translateX(${shift.toFixed(1)}px)`
    for (let i = 0; i < points.length; i++) {
      const xValueElement = legendValues[i]
      const offset = points[i].x / xScale

      if (!valuesWidths[i]) {
        valuesWidths[i] = xValueElement.offsetWidth
      }

      // Can be calculated based on viewBox indexes
      // instead of geometry
      const visible = !(
        i % pow(2, stepMiltiplier)
        || (offset < -1 * shift)
        || ((valuesWidths[i] || APPROX_LABEL_WIDTH) + offset + shift > width)
      )

      if (visibilityState[i] !== visible) {
        if (visible) {
          scheduledToHide[i] = false
          visibilityState[i] = true
          xValueElement.classList.remove(LEGEND_ITEM_HIDDEN_CLASS);
        } else {
          if (i in scheduledToHide) {
            scheduledToHide[i] = true
          } else {
            scheduledToHide[i] = false
          }
          visibilityState[i] = false
          xValueElement.classList.add(LEGEND_ITEM_HIDDEN_CLASS);
        }
      }

      if (visible || scheduledToHide[i]) {
        xValueElement.style.transform = `translateX(${offset.toFixed(1)}px)`
      }
    }
  }
}

function calculateMultiplier (n) {
  for (let i = 3; i < 50; i++) {
    if (n < pow(2,i)) return i - 3
  }
}