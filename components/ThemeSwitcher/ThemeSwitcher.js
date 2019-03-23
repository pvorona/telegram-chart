import { LIGHT, DARK } from '../constants'

const label = {
  [LIGHT]: 'Switch to Night Mode',
  [DARK]: 'Switch to Day Mode',
}

const classNames = {
  [LIGHT]: 'theme-light',
  [DARK]: 'theme-dark',
}

export function ThemeSwitcher (initialTheme) {
  let theme = initialTheme

  const button = document.createElement('button')
  button.innerText = label[theme]
  button.classList.add('theme-switcher')
  button.addEventListener('click', function () {
    document.body.classList.remove(classNames[theme])
    theme = theme === LIGHT ? DARK : LIGHT
    button.innerText = label[theme]
    document.body.classList.add(classNames[theme])
  })

  return button
}