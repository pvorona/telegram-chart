export function renderGraphs ({ context, points, graphNames, lineWidth, strokeStyles, width, height, opacityState }) {
  context.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio)
  for (let i = 0; i < graphNames.length; i++) {
    const opacity = opacityState[graphNames[i]]
    if (opacity === 0) continue
    const color = `rgba(${hexToRGB(strokeStyles[graphNames[i]])},${opacity})`
    context.strokeStyle = color
    context.lineWidth = 1
    // context.lineWidth = lineWidth * devicePixelRatio
    // context.beginPath()
    for (let j = 1; j < points[graphNames[i]].length; j++) {
      const { x, y } = points[graphNames[i]][j]
      const { x: x0, y: y0 } = points[graphNames[i]][j - 1]
      // context.lineTo(x, y)
      line(x0, y0, x, y, context)
    }
    // context.stroke()
  }
}

function hexToRGB (hex) {
  const [hash, r1, r2, g1, g2, b1, b2] = hex
  return [
    parseInt(r1 + r2, 16),
    parseInt(g1 + g2, 16),
    parseInt(b1 + b2, 16),
  ]
}

function getVisibilityKey (name) {
  return `${name}_opacity`
}

function line (x0, y0, x1, y1, context) {
   var dx = Math.abs(x1 - x0);
   var dy = Math.abs(y1 - y0);
   var sx = (x0 < x1) ? 1 : -1;
   var sy = (y0 < y1) ? 1 : -1;
   var err = dx - dy;

   while (Math.abs(x0 - x1) > 1 || Math.abs(y0 - y1) > 1) {
      context.fillRect(x0, y0, 1, 1)
      context.fillRect(x1, y1, 1, 1)

      var e2 = 2*err;
      if (e2 > -dy) { err -= dy; x0  += sx; }
      if (e2 < dx) { err += dx; y0  += sy; }
   }
}