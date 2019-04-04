import { MONTHS, DAYS } from '../constants'
import { getShortNumber } from '../../util'

export function Tooltip ({
  graphNames,
  colors,
}) {
  function show () {
    element.style.visibility = 'visible'
  }

  function hide () {
    element.style.visibility = ''
  }

  function setPosition (x) {
    element.style.transform = `translateX(${x - element.offsetWidth / 2}px)`
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


