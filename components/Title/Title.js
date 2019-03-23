export function Title (title) {
  const element = document.createElement('div')
  element.className = 'title'
  element.innerText = title
  return element
}