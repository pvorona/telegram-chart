function findMaxElement (data) {
  let max = -Infinity
  for (let i = 0; i < data.length; i++) {
    if (data[i] > max) max = data[i]
  }
  return max
}