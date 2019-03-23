import { LIGHT, DARK } from '../constants'

export const NEXT_THEME = {
  [LIGHT]: DARK,
  [DARK]: LIGHT,
}

export const LABELS = {
  [LIGHT]: 'Switch to Night Mode',
  [DARK]: 'Switch to Day Mode',
}

export const THEME_CLASS_NAMES = {
  [LIGHT]: 'theme-light',
  [DARK]: 'theme-dark',
}
