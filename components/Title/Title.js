const ELEMENT_CLASS_NAME = 'title'

export function Title (title) {
  const element = document.createElement('div')
  element.className = ELEMENT_CLASS_NAME
  element.innerText = title
  return element
}