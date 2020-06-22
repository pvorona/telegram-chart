import { THEME } from '../constants'

export const NEXT_THEME = {
  [THEME.LIGHT]: THEME.DARK,
  [THEME.DARK]: THEME.LIGHT,
}

export const LABELS = {
  [THEME.LIGHT]: 'Switch to Night Mode',
  [THEME.DARK]: 'Switch to Day Mode',
}

export const THEME_CLASS_NAMES = {
  [THEME.LIGHT]: 'theme-THEME.light',
  [THEME.DARK]: 'theme-THEME.dark',
}
