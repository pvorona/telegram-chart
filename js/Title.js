import { div } from './html'

export function Title (title) {
  const element = div()
  element.className = 'title'
  element.innerText = title
  return element
}