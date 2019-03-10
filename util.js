function findMaxElement (data) {
  let max = -Infinity
  for (let i = 0; i < data.length; i++) {
    if (data[i] > max) max = data[i]
  }
  return max
}

// O(n)
function findMaxValue (data) {
  const max = findMaxElement(data)
  if (max % 10 === 0) return max
  if (max % 5 === 0) return max
  return max + (5 - max % 5)
}

