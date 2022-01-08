import { ChartOptions } from "../types";
// import data1 from "./dj/1593428647696-1593429881599.json"; // small
// import data2 from "./dj/1593461499573-1593461700192.json"; // small

import data1O from "./dj/1593495762538-1593515829173.json"; // good good
import data2O from "./dj/1593520483683-1593533756968.json"; // good good

const data1 = data1O.slice(0, Math.floor(data1O.length * 0.6));
const data2 = data2O.slice(0, Math.floor(data1O.length * 0.6));

export const chartOptions: ChartOptions[] = [
  {
    domain: data1.map((d) => d.timestamp),
    xAxisHeight: 14,
    xAxisMarginBottom: 5,
    graphNames: ["A", "B"],
    width: 100,
    height: 100,
    lineWidth: 1,
    overviewHeight: 75,
    overviewWidth: 100,
    OVERVIEW_LINE_WIDTH: 1,
    colors: { A: "#3DC23F", B: "#E42222" },
    data: {
      A: data1.map((d) => d.value),
      B: data2.map((d) => d.value),
    },
    total: data1.length,
    visibilityState: {
      A: true,
      B: true,
    },
    viewBox: {
      startIndex: (data1.length - 1) * 0.75,
      endIndex: data1.length - 1,
    },
  },
];
