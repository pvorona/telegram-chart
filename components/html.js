export function createElement (type, attributes = {}, children = []) {
  const element = document.createElement(type)
  Object.assign(element, attributes)
  children.forEach(child => element.appendChild(child))
  return element
}

export const div = () => document.createElement('div')