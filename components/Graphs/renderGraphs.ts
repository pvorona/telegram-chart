import { hexToRGB } from "../../util";

const MARGIN_OVERSHOOT = 1;
const TRANSPARENT = `rgba(0,0,0,0)`;

export function renderGraphs({
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
  lineJoinByName: { [series:string]: CanvasLineJoin }
  width: number;
  height: number;
}) {
  console.time('render')
  for (let i = 0; i < graphNames.length; i++) {
    const opacity = opacityState[graphNames[i]];
    if (opacity === 0) continue;
    const color = `rgba(${hexToRGB(strokeStyles[graphNames[i]])},${opacity})`;
    const gradientColorStart = `rgba(${hexToRGB(strokeStyles[graphNames[i]])},${
      opacity / 4
    })`;
    const gradientColorStop = `rgba(${hexToRGB(strokeStyles[graphNames[i]])},${
      opacity / 32
    })`;

    context.strokeStyle = color;
    context.lineWidth = lineWidth * devicePixelRatio;
    context.lineJoin = lineJoin[graphNames[i]];
    context.beginPath();

    for (let j = 0; j < points[graphNames[i]].length; j++) {
      const { x, y } = points[graphNames[i]][j];
      context.lineTo(x, y);

      if (j === points[graphNames[i]].length - 1) {
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
        context.lineTo(0 - MARGIN_OVERSHOOT, points[graphNames[i]][0].y);
        context.fillStyle = gradient;
        context.fill();
      }
    }

    context.stroke();
  }
  console.timeEnd('render')

}
