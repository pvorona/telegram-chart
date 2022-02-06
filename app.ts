import { Chart } from "./components";
import { ChartOptions } from "./types";
import "./css/styles.css";

type DataEntry = { timestamp: number; value: number };

type Theme = {
  body?: string;
  lineWidth?: number;
  overviewLineWidth?: number;
  overviewBoxShadow?: string;
  background: string;
  overviewBackdrop: string;
  overviewEdge: string;
  series: string[];
  tooltipLine: string;
  tooltipBackgroundColor: string;
  tooltipColor: string;
  x: string;
  y: string;
  yLabel: string;
};

const tooltipAlpha = 0.5;
const yLineAlpha = 0.15;
const yLabelAlpha = 1;
const dark = {
  overviewEdgeAlpha: 0.3,
  overviewEdgeLightness: 65,
};

const themes: Theme[] = [
  {
    background: `hsla(150, 6%, 25%, 1)`,
    overviewBackdrop: `hsla(150, 6%, 10%, 0.75)`,
    overviewEdge: `hsla(150, 6%, ${dark.overviewEdgeLightness}%, ${dark.overviewEdgeAlpha})`,
    tooltipLine: `hsla(150, 6%, 35%, ${tooltipAlpha})`,
    tooltipBackgroundColor: `hsla(150, 6%, 30%, 0.5)`,
    tooltipColor: "#afb3b1",
    series: ["#7ab885", "#e75a5a"],
    x: "hsl(150, 3%, 69%)",
    y: `hsla(150, 3%, 69%, ${yLineAlpha})`,
    yLabel: `hsla(150, 3%, 69%, ${yLabelAlpha})`,
  },
  {
    body: "linear-gradient(0deg, hsl(0, 0%, 20%), hsl(0, 0%, 30%))",
    background: "hsl(240, 0%, 25%)",
    overviewBackdrop: `hsla(240,0%,10%,0.75)`,
    overviewEdge: `hsla(240,0%, ${dark.overviewEdgeLightness}%, ${dark.overviewEdgeAlpha})`,
    series: ["#FFBD69", "#ef7171", "#543864"],
    tooltipLine: `hsla(0, 0%, 93%, ${tooltipAlpha})`,
    tooltipBackgroundColor: `hsla(240,0%,30%,0.5)`,
    tooltipColor: "#FFBD69",
    x: "hsl(34, 40%, 85%)",
    y: `hsla(34, 40%, 85%, ${yLineAlpha})`,
    yLabel: `hsla(34, 40%, 85%, ${yLabelAlpha})`,
  },
  {
    background: "hsl(222, 20%, 22%)",
    overviewBackdrop: `hsla(222, 20%, 10%,0.75)`,
    overviewEdge: `hsla(222, 20%, ${dark.overviewEdgeLightness}%, ${dark.overviewEdgeAlpha})`,
    tooltipBackgroundColor: `hsla(222, 20%,30%,0.5)`,
    series: ["#574B90", "#9E579D", "#FC85AE"],
    tooltipLine: `hsla(222, 20%, 77%, ${tooltipAlpha})`,
    tooltipColor: "hsl(222, 20%, 77%)",
    x: "hsl(222, 20%, 77%)",
    y: `hsla(222, 20%, 77%, ${yLineAlpha})`,
    yLabel: `hsla(222, 20%, 77%, ${yLabelAlpha})`,
  },
  {
    body: "linear-gradient(0deg, hsl(200deg 18% 15%), hsl(200deg 18% 20%) 50%, hsl(200deg 18% 23%) 100%)",
    background: "hsl(198, 17%, 20%)",
    overviewBackdrop: `hsla(198, 17%,10%,0.75)`,
    overviewEdge: `hsla(198, 17%, ${dark.overviewEdgeLightness}%, ${dark.overviewEdgeAlpha})`,
    tooltipBackgroundColor: `hsla(198, 17%, 30%, 0.5)`,
    series: ["#E84A5F", "#FECEA8", "#FF847C", "#6fadec"],
    tooltipLine: `hsla(198, 17%, 77%, ${tooltipAlpha})`,
    tooltipColor: "hsl(198, 17%, 77%)",
    x: "hsl(198, 17%, 77%)",
    y: `hsla(198, 17%, 77%, ${yLineAlpha})`,
    yLabel: `hsla(198, 17%, 77%, ${yLabelAlpha})`,
  },
  {
    body: "linear-gradient(0deg, hsl(224, 8%, 26%), hsl(224, 8%, 32%))",
    background: "hsl(224, 8%, 26%)",
    overviewBackdrop: `hsla(224, 8%,10%,0.75)`,
    overviewEdge: `hsla(224, 8%, ${dark.overviewEdgeLightness}%, ${dark.overviewEdgeAlpha})`,
    tooltipBackgroundColor: `hsla(224, 8%, 30%, 0.5)`,
    // series: ["#FF9999", "#FFC8C8"],
    series: ["#FF9999", "#b3adff"],
    tooltipLine: `hsla(198, 17%, 77%, ${tooltipAlpha})`,
    tooltipColor: "hsl(224, 8%, 77%)",
    x: "hsl(224, 8%, 77%)",
    y: `hsla(224, 8%, 77%, ${yLineAlpha})`,
    yLabel: `hsla(224, 8%, 77%, ${yLabelAlpha})`,
  },
  {
    background: "hsl(0, 0%, 100%)",
    series: ["#d85c7b", "#2EB086"],
    overviewBackdrop: `hsla(0, 0%, 80%, 0.45)`,
    overviewEdge: `hsla(0, 0%, 10%, 0.25)`,
    tooltipLine: `hsla(0, 0%, 77%, ${tooltipAlpha})`,
    tooltipBackgroundColor: `hsla(0, 0%, 100%, 0.75)`,
    x: "hsl(0, 0%, 35%)",
    y: `hsla(0, 0%, 35%, ${yLineAlpha})`,
    yLabel: `hsla(0, 0%, 35%, ${yLabelAlpha})`,
    tooltipColor: "hsl(0, 0%, 35%)",
    lineWidth: 2,
    overviewBoxShadow: "inset 0px 0 0 1px hsl(0deg 0% 75%)",
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
          ticks: 6,
          label: {
            color: theme.yLabel,
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
            marginBottom: 7,
            marginLeft: 10,
          },
        },
        width: chartContainer.offsetWidth,
        height: chartContainer.offsetHeight,
        lineWidth: theme.lineWidth || 1,
        overview: {
          height: 100,
          lineWidth: theme.overviewLineWidth || 1,
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
        lineJoin: {
          A: "round",
          B: "round",
        },
        colors: { A: theme.series[0], B: theme.series[1] },
        total: data1.length,
        visibility: {
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
