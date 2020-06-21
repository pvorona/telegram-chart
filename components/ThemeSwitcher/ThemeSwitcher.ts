import { THEME } from '../constants'
import {
  LABELS,
  THEME_CLASS_NAMES,
  NEXT_THEME,
} from './ThemeSwitcher.constants'

const ELEMENT_CLASS_NAME = 'theme-switcher'

export function ThemeSwitcher (initialTheme: THEME) {
  let theme = initialTheme
  const button = createDOM()

  button.onclick = () => {
    document.body.classList.remove(THEME_CLASS_NAMES[theme])
    theme = NEXT_THEME[theme]
    button.innerText = LABELS[theme]
    document.body.classList.add(THEME_CLASS_NAMES[theme])
  }

  return button

  function createDOM () {
    const button = document.createElement('button')
    button.innerText = LABELS[theme]
    button.classList.add(ELEMENT_CLASS_NAME)
    return button
  }
}