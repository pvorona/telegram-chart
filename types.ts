export type Lambda = () => void

export interface ChartData {
  columns: (number | string)[][]
  types: { [key: string]: string }
  colors: { [key: string]: string }
  names: { [key: string]: string }
}

export interface VisibilityState {
  [key: string]: boolean
}

// export interface Data {
//   [key: string]: number[]
// }
export interface Data {
  [key: string]: {
    [depth: number]: number[]
  }
}

export interface ChartOptions {
  // domain: number[]
  domain: {
    [depth: number]: number[]
  }
  graphNames: (string)[]
  width: number
  height: number
  lineWidth: number
  overviewHeight: number
  overviewWidth: number
  OVERVIEW_LINE_WIDTH: number
  colors: { [key: string]: string }
  data: Data
  // total: number
  total: {
    [depth: number]: number
  }
  visibilityState: VisibilityState
  viewBox: {
    startIndex: number
    endIndex: number
  }
}
