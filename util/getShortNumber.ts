var suffixes = {
  'K': 6,
  'M': 9,
  'B': 12,
  'T': 16
}

export function getShortNumber (num: number): string {
  if (Math.abs(num) < 1000) {
    return String(num)
  }

  var shortNumber
  var exponent
  var size

  num = Math.abs(num);
  size = Math.floor(num).toString().length

  exponent = size % 3 === 0 ? size - 3 : size - (size % 3)
  shortNumber = String(Math.round(10 * (num / Math.pow(10, exponent))) / 10)

  var suffix: keyof typeof suffixes
  for (suffix in suffixes) {
    if (exponent < suffixes[suffix]) {
      shortNumber += suffix
      break
    }
  }

  return String(shortNumber)
}