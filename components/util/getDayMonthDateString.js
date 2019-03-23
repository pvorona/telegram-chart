import { MONTHS, DAYS } from '../constants'

export function getDayMonthDateString (timestamp) {
  const date = new Date(timestamp)
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}
