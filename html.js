function createElement (type, attributes = {}, children = []) {
  const element = document.createElement(type)
  setElementAttributes(element, attributes)
  children.forEach(child => element.appendChild(child))
  return element
}

function validateElementAttributes (element, props) {
  for (let prop in props) {
    if (!(prop in element)) throw Error('No such prop')
  }
}

function setElementAttributes (element, attributes) {
  validateElementAttributes(element, attributes)
  for (const attributeName in attributes) {
    element[attributeName] = attributes[attributeName]
  }
}

function createCanvases (graphNames, attributes) {
  return graphNames.reduce((canvases, graphName) => ({
    ...canvases,
    [graphName]: createElement('canvas', attributes),
  }), {})
}
