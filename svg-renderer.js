var renderPath = svgRenderer

function svgRenderer (points, color, targetContext, frameContext) {
  const path = ['M 0 480']
  if (!frameRendered) {
    frameContext.beginPath();
    frameContext.strokeStyle = color
  }

  for (let i = 0; i < points.length; i++) {
    const { x, y, frameX, frameY } = points[i]
    path.push(`L ${x} ${y}`)
    if (!frameRendered) {
      frameContext.lineTo(frameX, frameY)
    }
  }

  if (!frameRendered) {
    frameContext.stroke()
  }
  const pathEl = document.createElementNS('http://www.w3.org/2000/svg',"path");
  pathEl.setAttributeNS(null, 'd', path.join(' '))
  pathEl.setAttributeNS(null, 'stroke', color)
  pathEl.setAttributeNS(null, 'stroke-width', "2")
  pathEl.setAttributeNS(null, 'fill', "none")
  svg.appendChild(pathEl)
}