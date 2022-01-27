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

async function startApp() {
  try {
    const response1 = await fetch("./data/dj/1593495762538-1593515829173.json");
    const data1O = await response1.json();
    const response2 = await fetch("./data/dj/1593520483683-1593533756968.json");
    const data2O = await response2.json();
    const data1: DataEntry[] = data1O.slice(0, Math.floor(data1O.length * 0.6));
    const data2: DataEntry[] = data2O.slice(0, Math.floor(data1O.length * 0.6));
    const chartContainer = document.getElementById("chart")!;
    const options: ChartOptions = {
      x: {
        color: "#afb3b1",
        marginBottom: 5,
        ticks: 8,
        tick: {
          height: 10,
          margin: 10,
        },
        label: {
          width: 40,
          fontSize: 12,
          fontFamily: "system-ui, sans-serif",
        },
      },
      y: {
        color: "#afb3b180",
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
      colors: { A: "#3DC23F", B: "#E42222" },
      total: data1.length,
      visibilityState: {
        A: true,
        B: true,
      },
    };
    const { element } = Chart(options);

    chartContainer.appendChild(element);
  } catch (error) {
    console.error(error);
  }
}

startApp();
