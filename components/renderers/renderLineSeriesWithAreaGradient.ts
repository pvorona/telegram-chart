import { CssPixel } from "../../types";
import { hexToRGB, cssToBitMap } from "../../util";
import { Point } from "../types";

const MARGIN_OVERSHOOT = 1 as CssPixel;
const TRANSPARENT = `rgba(0,0,0,0)`;

export function renderLineSeriesWithAreaGradient({
  context,
  points,
  graphNames,
  lineWidth,
  strokeStyles,
  opacityState,
  lineJoinByName,
  width,
  height,
}: {
  context: CanvasRenderingContext2D;
  points: { [key: string]: Point[] };
  graphNames: string[];
  lineWidth: CssPixel;
  strokeStyles: { [key: string]: string };
  opacityState: { [key: string]: number };
  lineJoinByName: { [series: string]: CanvasLineJoin };
  width: CssPixel;
  height: CssPixel;
}) {
  for (let i = 0; i < graphNames.length; i++) {
    const graphName = graphNames[i];
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
    context.lineWidth = cssToBitMap(lineWidth);
    context.lineJoin = lineJoinByName[graphName];
    context.beginPath();

    for (let j = 0; j < points[graphName].length; j++) {
      const { x, y } = points[graphName][j];
      context.lineTo(cssToBitMap(x), cssToBitMap(y));

      if (j === points[graphName].length - 1) {
        const gradient = context.createLinearGradient(
          0,
          0,
          0,
          cssToBitMap(height)
        );
        gradient.addColorStop(0, gradientColorStart);
        gradient.addColorStop(0.5, gradientColorStop);
        gradient.addColorStop(1, TRANSPARENT);

        context.lineTo(
          cssToBitMap((width + MARGIN_OVERSHOOT) as CssPixel),
          cssToBitMap(y)
        );
        context.lineTo(
          cssToBitMap((width + MARGIN_OVERSHOOT) as CssPixel),
          cssToBitMap((height + MARGIN_OVERSHOOT) as CssPixel)
        );
        context.lineTo(
          cssToBitMap((0 - MARGIN_OVERSHOOT) as CssPixel),
          cssToBitMap((height + MARGIN_OVERSHOOT) as CssPixel)
        );
        context.lineTo(
          cssToBitMap((0 - MARGIN_OVERSHOOT) as CssPixel),
          cssToBitMap(points[graphName][0].y)
        );
        context.fillStyle = gradient;
        context.fill();
      }
    }

    context.stroke();
  }
}
