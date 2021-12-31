// import { DARK } from './components/constants'
import {
  // ThemeSwitcher,
  Chart,
  ChartContext,
} from "./components";
import { chartOptions } from "./data/dj";

// document.body.appendChild(ThemeSwitcher(DARK))

// const appContainer = document.getElementById('app')!
const chartContainer = document.getElementById("chart")!;

chartContainer.appendChild(
  Chart(
    {
      ...chartOptions[0],
      width: chartContainer.offsetWidth,
      height: chartContainer.offsetHeight,
    },
    ChartContext
  ).element
);
