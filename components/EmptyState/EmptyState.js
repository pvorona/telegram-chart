export function EmptyState () {
  const element = document.createElement('div')
  element.className = 'empty-state'
  element.innerText = 'Nothing to show'
  element.style.opacity = 0

  return { element, setVisibile }

  function setVisibile (visible) {
    element.style.opacity = visible ? 0 : 1
  }
}