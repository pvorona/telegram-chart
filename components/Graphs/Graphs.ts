import { hexToRGB } from '../../util'

export function renderGraphs ({
  context,
  points,
  graphNames,
  lineWidth,
  strokeStyles,
  width,
  height,
  opacityState,
}: {
  context: CanvasRenderingContext2D,
  points: { [key: string]: { x: number, y: number }[] },
  graphNames: string[],
  lineWidth: number,
  strokeStyles: { [key: string]: string },
  width: number,
  height: number,
  opacityState: { [key: string]: number },
}) {
  context.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio)
  for (let i = 0; i < graphNames.length; i++) {
    const opacity = opacityState[graphNames[i]]
    if (opacity === 0) continue
    const color = `rgba(${hexToRGB(strokeStyles[graphNames[i]])},${opacity})`
    context.strokeStyle = color
    context.lineWidth = lineWidth * devicePixelRatio
    context.lineJoin = 'round'
    context.beginPath()
    for (let j = 0; j < points[graphNames[i]].length; j++) {
      const { x, y } = points[graphNames[i]][j]
      context.lineTo(x, y)
    }
    context.stroke()
  }
}
