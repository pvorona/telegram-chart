const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function XAxis (domain) {
  const containerElement = document.createElement('div')
  containerElement.style = 'overflow:hidden;max-width: 768px;'
  const shiftingContainer = document.createElement('div')
  shiftingContainer.classList.add('shifting-container')
  containerElement.appendChild(shiftingContainer)
  domain.map(timestamp => {
    const xValueElement = document.createElement('div')
    const date = new Date(timestamp)
    xValueElement.innerText = `${MONTHS[date.getMonth()]} ${date.getDate()}`
    return xValueElement
  }).forEach(xValueElement =>
    shiftingContainer.appendChild(xValueElement)
  )
  return containerElement

  function render () {
    // shiftingContainer.style.transform = 'translateX(-)'
    // const visibleDomain = chartConfig.domain.slice(
    //   Math.ceil(chartConfig.renderWindow.startIndex),
    //   Math.floor(chartConfig.renderWindow.endIndex),
    // )

    // setTranslateAccordingToRenderWindow
  }
}
