export function getShortNumber (num) {
  if (Math.abs(num) < 1000) {
    return num
  }

  var shortNumber
  var exponent
  var size
  var suffixes = {
    'K': 6,
    'M': 9,
    'B': 12,
    'T': 16
  }

  num = Math.abs(num);
  size = Math.floor(num).toString().length

  exponent = size % 3 === 0 ? size - 3 : size - (size % 3)
  shortNumber = Math.round(10 * (num / Math.pow(10, exponent))) / 10

  for (var suffix in suffixes) {
    if (exponent < suffixes[suffix]) {
      shortNumber += suffix
      break
    }
  }

  return shortNumber
}