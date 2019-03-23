import { MONTHS, DAYS } from '../constants'

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
      tooltipValues[graphName].innerText = getValueText(value[graphName])
    }
  }
}

function getValueText (num) {
  if(Math.abs(num) < 1000) {
    return num;
  }

  var shortNumber;
  var exponent;
  var size;
  var sign = num < 0 ? '-' : '';
  var suffixes = {
    'K': 6,
    'M': 9,
    'B': 12,
    'T': 16
  };

  num = Math.abs(num);
  size = Math.floor(num).toString().length;

  exponent = size % 3 === 0 ? size - 3 : size - (size % 3);
  shortNumber = Math.round(10 * (num / Math.pow(10, exponent))) / 10;

  for(var suffix in suffixes) {
    if(exponent < suffixes[suffix]) {
      shortNumber += suffix;
      break;
    }
  }

  return sign + shortNumber;
}

function getTooltipDateText (timestamp) {
  const date = new Date(timestamp)
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}
