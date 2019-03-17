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

  const xScale = (viewBox.endIndex + 1 - viewBox.startIndex) / domain.length
  shiftingContainer.style.transform = `translateX(${-1 / xScale * 768 * viewBox.startIndex / domain.length}px)`
  let previousOffset = -Infinity
  for (let i = 0; i < points.length; i++) {
    const xValueElement = legendValues[i]
    const offset = points[i].x / devicePixelRatio / xScale
    xValueElement.style.transform = `translateX(${offset}px)`
    if (offset - previousOffset < 50) {
      xValueElement.hidden = true
    } else {
      previousOffset = offset
    }
  }

  return [containerElement, update]

  function update ({ type }) {
    if (type === EVENTS.VIEW_BOX_CHANGE) {

      const xScale = (viewBox.endIndex + 1 - viewBox.startIndex) / domain.length
      shiftingContainer.style.transform = `translateX(${-1 / xScale * 768 * viewBox.startIndex / domain.length}px)`
      let previousOffset = -Infinity

      for (let i = 0; i < points.length; i++) {
        const xValueElement = legendValues[i]
        const offset = points[i].x / devicePixelRatio / xScale
        // need to change it only if xScale changed
        xValueElement.style.transform = `translateX(${offset}px)`
        if (offset - previousOffset < 50) {
          xValueElement.hidden = true
        } else {
          xValueElement.hidden = false
          previousOffset = offset
        }
      }


    }
  }

  function getLabelText (timestamp) {
    const date = new Date(timestamp)
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`
  }
}
