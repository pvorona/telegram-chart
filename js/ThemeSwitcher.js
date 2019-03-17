const THEMES = {
  LIGHT: 0,
  DARK: 1,
}

const label = {
  [THEMES.LIGHT]: 'Switch to Night Mode',
  [THEMES.DARK]: 'Switch to Day Mode',
}

const classNames = {
  [THEMES.LIGHT]: 'theme-light',
  [THEMES.DARK]: 'theme-dark',
}

export function ThemeSwitcher (initialTheme) {
  let theme = initialTheme

  const button = document.createElement('button')
  button.innerText = label[theme]
  button.classList.add('theme-switcher')
  button.addEventListener('click', function () {
    document.body.classList.remove(classNames[theme])
    theme = theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    button.innerText = label[theme]
    document.body.classList.add(classNames[theme])
  })

  return button
}