import { Chart } from "./components";
import { ChartOptions } from "./types";
import "./css/styles.css";

type DataEntry = { timestamp: number; value: number };

// type Series = {
//   title?: string
//   series?: number[]
//   color?: string
//   isVisible?: boolean
// }

// const graphs = [{
//   title: 'A',
//   data: [1, 2],
//   color: 'red',
//   visible: true,
// }]

type Theme = {
  background: string;
  overviewBackdrop: string;
  overviewEdge: string;
  series: string[];
  tooltipLine: string;
  tooltipBackgroundColor: string;
  tooltipColor: string;
  x: string;
  y: string;
};

const HUE_1 = 168;

const themes: Theme[] = [
  {
    background: `hsla(${HUE_1}, 2%, 18%, 1)`,
    overviewBackdrop: `hsla(${HUE_1}, 2%, 10%, 0.75)`,
    overviewEdge: `hsla(${HUE_1}, 2%, 30%, 0.5)`,
    tooltipLine: `hsla(${HUE_1}, 2%, 35%)`,
    tooltipBackgroundColor: `hsla(${HUE_1}, 2%, 30%, 0.5)`,
    tooltipColor: "#afb3b1",
    series: ["#3DC23F", "#E42222"],
    x: "#afb3b1",
    y: "#afb3b180",
  },
  {
    background: "hsl(216,12%,16%)",
    overviewBackdrop: `hsla(216,18%,10%,0.75)`,
    overviewEdge: `hsla(216,18%,30%,0.5)`,
    series: ["#30475E", "#C1A57B"],
    tooltipLine: `#ECECEC`,
    tooltipBackgroundColor: `hsla(216,18%,30%,0.5)`,
    tooltipColor: "#ECECEC",
    x: "#ECECEC",
    y: "#ECECEC",
  },
  {
    background: "hsl(240, 8%, 19%)",
    overviewBackdrop: `hsla(240,18%,10%,0.75)`,
    overviewEdge: `hsla(240,18%,30%,0.5)`,
    series: ["#FFBD69", "#FF6363", "#543864"],
    tooltipLine: `#ECECEC`,
    tooltipBackgroundColor: `hsla(240,18%,30%,0.5)`,
    tooltipColor: "#FFBD69",
    x: "#FFBD69",
    y: "#FFBD69",
  },
];

function selectRandomTheme(): Theme {
  const themeIndex = Math.floor(Math.random() * themes.length);
  console.log(`Selected theme: ${themeIndex}`);
  return themes[themeIndex];
}

const theme = selectRandomTheme();
document.body.style.backgroundColor = theme.background;

async function startApp() {
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const response1 = await fetch(
        "./data/dj/1593495762538-1593515829173.json"
      );
      const data1O = await response1.json();
      const response2 = await fetch(
        "./data/dj/1593520483683-1593533756968.json"
      );
      const data2O = await response2.json();
      const data1: DataEntry[] = data1O.slice(
        0,
        Math.floor(data1O.length * 0.6)
      );
      const data2: DataEntry[] = data2O.slice(
        0,
        Math.floor(data1O.length * 0.6)
      );
      const chartContainer = document.getElementById("chart")!;
      const options: ChartOptions = {
        x: {
          color: theme.x,
          marginBottom: 5,
          ticks: 8,
          tick: {
            height: 0,
            margin: 0,
          },
          label: {
            width: 40,
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
          },
        },
        y: {
          color: theme.y,
          ticks: 5,
          label: {
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
          },
        },
        width: chartContainer.offsetWidth,
        height: chartContainer.offsetHeight,
        lineWidth: 1,
        overview: {
          height: 100,
          lineWidth: 1,
          overlayColor: theme.overviewBackdrop,
          edgeColor: theme.overviewEdge,
        },
        viewBox: {
          startIndex: (data1.length - 1) * 0.75,
          endIndex: data1.length - 1,
        },
        graphNames: ["A", "B"],
        domain: data1.map((d) => d.timestamp),
        data: {
          A: data1.map((d) => d.value),
          B: data2.map((d) => d.value),
        },
        colors: { A: theme.series[0], B: theme.series[1] },
        total: data1.length,
        visibilityState: {
          A: true,
          B: true,
        },
        tooltip: {
          lineColor: theme.tooltipLine,
          backgroundColor: theme.tooltipBackgroundColor,
          color: theme.tooltipColor,
        },
      };
      const { element } = Chart(options);

      chartContainer.appendChild(element);
    } catch (error) {
      console.error(error);
    }
  });
}

startApp();
