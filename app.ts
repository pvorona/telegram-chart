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
  body?: string;
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

const tooltipAlpha = 0.5;

const themes: Theme[] = [
  {
    background: `hsla(150, 6%, 25%, 1)`,
    overviewBackdrop: `hsla(150, 6%, 10%, 0.75)`,
    overviewEdge: `hsla(150, 6%, 30%, 0.5)`,
    tooltipLine: `hsla(150, 6%, 35%, ${tooltipAlpha})`,
    tooltipBackgroundColor: `hsla(150, 6%, 30%, 0.5)`,
    tooltipColor: "#afb3b1",
    series: ["#7ab885", "#f64c4c"],
    x: "#afb3b1",
    y: "#afb3b180",
  },
  {
    background: "hsl(240, 0%, 25%)",
    overviewBackdrop: `hsla(240,0%,10%,0.75)`,
    overviewEdge: `hsla(240,0%,30%,0.5)`,
    series: ["#FFBD69", "#ef7171", "#543864"],
    tooltipLine: `hsla(0, 0%, 93%, ${tooltipAlpha})`,
    tooltipBackgroundColor: `hsla(240,0%,30%,0.5)`,
    tooltipColor: "#FFBD69",
    x: "hsl(34, 40%, 85%)",
    y: "hsl(34, 40%, 85%)",
  },
  {
    background: "hsl(222, 20%, 22%)",
    overviewBackdrop: `hsla(222, 20%, 10%,0.75)`,
    overviewEdge: `hsla(222, 20%,30%,0.5)`,
    tooltipBackgroundColor: `hsla(222, 20%,30%,0.5)`,
    series: ["#574B90", "#9E579D", "#FC85AE"],
    tooltipLine: `hsla(222, 20%, 77%, ${tooltipAlpha})`,
    tooltipColor: "hsl(222, 20%, 77%)",
    x: "hsl(222, 20%, 77%)",
    y: "hsl(222, 20%, 77%)",
  },
  {
    body: "linear-gradient(0deg, hsl(200deg 18% 15%), hsl(200deg 18% 20%) 50%, hsl(200deg 18% 23%) 100%)",
    background: "hsl(198, 17%, 20%)",
    overviewBackdrop: `hsla(198, 17%,10%,0.75)`,
    overviewEdge: `hsla(198, 17%, 30%, 0.5)`,
    tooltipBackgroundColor: `hsla(198, 17%, 30%, 0.5)`,
    series: ["#E84A5F", "#FECEA8", "#FF847C", "#6fadec"],
    tooltipLine: `hsla(198, 17%, 77%, ${tooltipAlpha})`,
    tooltipColor: "hsl(198, 17%, 77%)",
    x: "hsl(198, 17%, 77%)",
    y: "hsl(198, 17%, 77%)",
  },
  {
    background: "hsl(224, 8%, 26%)",
    overviewBackdrop: `hsla(224, 8%,10%,0.75)`,
    overviewEdge: `hsla(224, 8%, 30%, 0.5)`,
    tooltipBackgroundColor: `hsla(224, 8%, 30%, 0.5)`,
    series: ["#FF9999", "#FFC8C8"],
    tooltipLine: `hsla(198, 17%, 77%, ${tooltipAlpha})`,
    tooltipColor: "hsl(224, 8%, 77%)",
    x: "hsl(224, 8%, 77%)",
    y: "hsl(224, 8%, 77%)",
  },
];

function selectRandomTheme(): Theme {
  const themeIndex = Math.floor(Math.random() * themes.length);
  console.log(`Selected theme: ${themeIndex}`);
  return themes[themeIndex];
}

const theme = selectRandomTheme();

document.body.style.background = theme.body || theme.background;

async function startApp() {
  const series1 = fetch("./data/dj/1593495762538-1593515829173.json").then(
    (r) => r.json()
  );
  const series2 = fetch("./data/dj/1593520483683-1593533756968.json").then(
    (r) => r.json()
  );

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const [data1O, data2O] = await Promise.all([series1, series2]);
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
          marginBottom: 7,
          marginTop: 10,
          ticks: 8,
          tick: {
            height: 0,
            margin: 0,
          },
          label: {
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
