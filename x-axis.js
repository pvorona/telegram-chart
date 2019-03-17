const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const LEGEND_ITEM_CLASS = 'legend-item-value'

function XAxis ({
  domain,
  points,
  viewBox,
}) {
  const containerElement = document.createElement('div')
  containerElement.style = 'overflow:hidden;max-width: 768px;'
  const shiftingContainer = document.createElement('div')
  shiftingContainer.classList.add('shifting-container')
  containerElement.appendChild(shiftingContainer)
  const legendValues = []

  for (let i = 0; i < points.length; i++) {
    const timestamp = domain[i]
    const xValueElement = document.createElement('div')
    xValueElement.innerText = getLabelText(timestamp)
    xValueElement.classList.add(LEGEND_ITEM_CLASS)
    legendValues.push(xValueElement)
    shiftingContainer.appendChild(xValueElement)
  }

  reconcile()

  function reconcile () {
    const xScale = (viewBox.endIndex - viewBox.startIndex) / (domain.length - 1)
    // console.log(viewBox)
    shiftingContainer.style.transform = `translateX(${-1 / xScale * 768 * viewBox.startIndex / (domain.length - 1)}px)`
    let previousOffset = -Infinity
    // console.log(points)
    // console.log(xScale)
    for (let i = 0; i < points.length; i++) {
      const xValueElement = legendValues[i]
      const offset = points[i].x / xScale
      xValueElement.style.transform = `translateX(${offset}px)`
      if (offset - previousOffset < 150) {
        xValueElement.hidden = true
      } else {
        previousOffset = offset
        xValueElement.hidden = false
      }
    }
  }

  return [containerElement, update]

  function update ({ type }) {
    if (type === EVENTS.VIEW_BOX_CHANGE) {
      reconcile()
    }
  }

  function getLabelText (timestamp) {
    const date = new Date(timestamp)
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`
  }
}
