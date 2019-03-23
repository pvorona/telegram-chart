import {
  LABELS,
  THEME_CLASS_NAMES,
  NEXT_THEME,
} from './ThemeSwitcher.constants'

const ELEMENT_CLASS_NAME = 'theme-switcher'

export function ThemeSwitcher (initialTheme) {
  let theme = initialTheme

  const button = document.createElement('button')
  button.innerText = LABELS[theme]
  button.classList.add(ELEMENT_CLASS_NAME)
  button.addEventListener('click', function () {
    document.body.classList.remove(THEME_CLASS_NAMES[theme])
    theme = NEXT_THEME[theme]
    button.innerText = LABELS[theme]
    document.body.classList.add(THEME_CLASS_NAMES[theme])
  })

  return button
}