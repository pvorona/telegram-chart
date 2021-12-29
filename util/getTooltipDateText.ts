import { MONTHS } from "../components/constants";

export function getTooltipDateText(timestamp: number) {
  const date = new Date(timestamp);
  return `${
    MONTHS[date.getMonth()]
  } ${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
