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

chartOptions.forEach((options) => {
  const betterOptions = {
    ...options,
    width: chartContainer.offsetWidth,
    height: chartContainer.offsetHeight,
  };

  chartContainer.appendChild(
    Chart(betterOptions, ChartContext(betterOptions)).element
  );
});
