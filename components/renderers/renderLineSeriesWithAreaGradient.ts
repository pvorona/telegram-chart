import { hexToRGB } from "../../util";

const MARGIN_OVERSHOOT = 1;
const TRANSPARENT = `rgba(0,0,0,0)`;

export function renderLineSeriesWithAreaGradient({
  context,
  points,
  graphNames,
  lineWidth,
  strokeStyles,
  opacityState,
  lineJoinByName: lineJoin,
  width,
  height,
}: {
  context: CanvasRenderingContext2D;
  points: { [key: string]: { x: number; y: number }[] };
  graphNames: string[];
  lineWidth: number;
  strokeStyles: { [key: string]: string };
  opacityState: { [key: string]: number };
  lineJoinByName: { [series: string]: CanvasLineJoin };
  width: number;
  height: number;
}) {
  for (let i = 0; i < graphNames.length; i++) {
    const graphName = graphNames[i]
    const opacity = opacityState[graphName];

    if (opacity === 0) continue;

    const color = `rgba(${hexToRGB(strokeStyles[graphName])},${opacity})`;
    const gradientColorStart = `rgba(${hexToRGB(strokeStyles[graphName])},${
      opacity / 4
    })`;
    const gradientColorStop = `rgba(${hexToRGB(strokeStyles[graphName])},${
      opacity / 32
    })`;

    context.strokeStyle = color;
    context.lineWidth = lineWidth * devicePixelRatio;
    context.lineJoin = lineJoin[graphName];
    context.beginPath();

    for (let j = 0; j < points[graphName].length; j++) {
      const { x, y } = points[graphName][j];
      context.lineTo(x, y);

      if (j === points[graphName].length - 1) {
        const gradient = context.createLinearGradient(
          0,
          0,
          0,
          height * devicePixelRatio
        );
        gradient.addColorStop(0, gradientColorStart);
        gradient.addColorStop(0.5, gradientColorStop);
        gradient.addColorStop(1, TRANSPARENT);

        context.lineTo(width * devicePixelRatio + MARGIN_OVERSHOOT, y);
        context.lineTo(
          width * devicePixelRatio + MARGIN_OVERSHOOT,
          height * devicePixelRatio + MARGIN_OVERSHOOT
        );
        context.lineTo(
          0 - MARGIN_OVERSHOOT,
          height * devicePixelRatio + MARGIN_OVERSHOOT
        );
        context.lineTo(0 - MARGIN_OVERSHOOT, points[graphName][0].y);
        context.fillStyle = gradient;
        context.fill();
      }
    }

    context.stroke();
  }
}
