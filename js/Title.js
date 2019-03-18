export function Title (title) {
  const element = document.createElement('div')
  element.className = 'title'
  element.textContent = title
  return element
}