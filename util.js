function findMaxElement (values, { startIndex, endIndex}) {
  let max = values[0][startIndex]
  for (let j = 0; j < values.length; j++) {
    for (let i = startIndex; i <= endIndex; i++) {
      if (values[j][i] > max) max = values[j][i]
    }
  }
  return max
}

// O(n)
function findMaxValue (renderWindow, ...values) {
  const max = findMaxElement(values, renderWindow)
  if (max % 10 === 0) return max
  if (max % 5 === 0) return max
  return max + (5 - max % 5)
}

