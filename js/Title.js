export function Title (title) {
  const element = document.createElement('div')
  element.classList.add('title')
  element.textContent = title
  return element
}