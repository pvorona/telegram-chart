function createElement (type, attributesOrChildren, ...children) {
  const element = document.createElement(type)
  if (Array.isArray(attributesOrChildren)) {
    attributesOrChildren.forEach(child => element.appendChild(child))
  } else if (typeof attributesOrChildren === 'object') {
    setElementAttributes(element, attributesOrChildren)
  } else if (attributesOrChildren instanceof window.Element) {
    element.appendChild(attributesOrChildren)
  }
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

const label = (...args) => createElement('label', ...args)
const input = (...args) => createElement('input', ...args)
const div = (...args) => createElement('div', ...args)

