d = d[0]

d.domain = { 0: d.domain }
d.data["Dow Jones 30"] = { 0: d.data["Dow Jones 30"] }
d.total = { 0: d.total }

function fillDepth (depth) {
  if (!depth) throw new Error

  var newData = []
  var newTime = []
  for (let i = depth; i < d.data['Dow Jones 30'][depth - 1].length; i += 2) {
    const value = (d.data['Dow Jones 30'][depth - 1][i] + d.data['Dow Jones 30'][depth - 1][i - 1]) / 2
    // for (let i = 0; i <= depth; i++) {
      newData.push( value )
    // }

    const time = (d.domain[depth - 1][i] + d.domain[depth - 1][i - 1]) / 2
    // for (let i = 0; i <= depth; i++) {
      newTime.push( time )
    // }
  }

  d.data['Dow Jones 30'][depth] = newData
  d.domain[depth] = newTime
  d.total[depth] = newTime.length
}

