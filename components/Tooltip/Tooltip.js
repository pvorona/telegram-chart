import { MONTHS, DAYS } from '../constants'
import { getShortNumber } from '../util'

export function Tooltip ({
  graphNames,
  colors,
}) {
  const element = document.createElement('div')
  element.className = 'tooltip'

  const tooltipDate = document.createElement('div')
  tooltipDate.style.padding = '10px 10px 0'
  element.appendChild(tooltipDate)

  const tooltipLegendContainer = document.createElement('div')
  tooltipLegendContainer.className = 'tooltip__legend'
  element.appendChild(tooltipLegendContainer)

  const tooltipValues = {}
  const graphInfos = {}
  graphNames.forEach(graphName => {
    const tooltipGraphInfo = document.createElement('div')
    tooltipGraphInfo.style.color = colors[graphName]
    tooltipGraphInfo.style.padding = '0 10px 10px'
    graphInfos[graphName] = tooltipGraphInfo

    const tooltipValue = document.createElement('div')
    tooltipValue.style.fontWeight = 'bold'
    tooltipGraphInfo.appendChild(tooltipValue)

    const graphNameElement = document.createElement('div')
    graphNameElement.innerText = graphName
    tooltipGraphInfo.appendChild(graphNameElement)

    tooltipValues[graphName] = tooltipValue
    tooltipLegendContainer.appendChild(tooltipGraphInfo)
  })

  return { element, show, hide, setPosition, setDate, showValues }

  function show () {
    element.style.visibility = 'visible'
  }

  function hide () {
    element.style.visibility = ''
  }

  function setPosition (x) {
    element.style.transform = `translateX(calc(${x}px - 50%))`
  }

  function setDate (text) {
    tooltipDate.innerText = getTooltipDateText(text)
  }

  function showValues (value) {
    for (const graphName in tooltipValues) {
      graphInfos[graphName].hidden = true
    }
    for (const graphName in value) {
      graphInfos[graphName].hidden = false
      tooltipValues[graphName].innerText = getShortNumber(value[graphName])
    }
  }
}

function getTooltipDateText (timestamp) {
  const date = new Date(timestamp)
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}
