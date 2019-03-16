const MODES = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
}

const label = {
  [MODES.LIGHT]: 'Switch to Night mode',
  [MODES.DARK]: 'Switch to Day mode',
}

const classNames = {
  [MODES.LIGHT]: 'theme-light',
  [MODES.DARK]: 'theme-dark',
}

function ThemeSwitcher () {
  let mode = MODES.LIGHT

  const button = document.createElement('button')
  button.innerText = label[mode]
  button.classList.add('theme-switcher')
  button.addEventListener('click', function () {
    document.body.classList.remove(classNames[mode])
    mode = mode === MODES.LIGHT ? MODES.DARK : MODES.LIGHT
    button.innerText = label[mode]
    document.body.classList.add(classNames[mode])
  })
  document.body.appendChild(button)
}