interface SegmentNode <T> {
  startIndex: number
  endIndex: number
  // range: [number, number]
  value: T
  left?: SegmentNode<T>
  right?: SegmentNode<T>
}

export interface SegmentTree <T> {
  get (startIndex: number, endIndex: number): T
}

export function createRootNode <T> (
  array: T[],
  operation: (left: T, right: T) => T,
  startIndex: number | undefined = 0,
  endIndex: number | undefined = array.length - 1,
): SegmentNode<T> {
  if (array.length === 1) {
    return {
      value: array[0],
      startIndex,
      endIndex,
    }
  }

  return combineNodes(
    createRootNode(
      array.slice(0, Math.floor(array.length / 2)),
      operation,
      startIndex,
      startIndex + Math.floor(array.length / 2) - 1,
    ),
    createRootNode(
      array.slice(Math.floor(array.length / 2)),
      operation,
      startIndex + Math.floor(array.length / 2),
      endIndex,
    ),
    operation,
  )
}

function combineNodes <T> (
  left: SegmentNode<T>,
  right: SegmentNode<T>,
  operation: (left: T, right: T) => T
): SegmentNode<T> {
  return {
    startIndex: left.startIndex,
    endIndex: right.endIndex,
    value: operation(left.value, right.value),
    left,
    right,
  }
}

export function createMinSegmentTree (root: SegmentNode<number>) : SegmentTree<number> {
  function get (startIndex: number, endIndex: number): number {
    if (endIndex < startIndex) throw new Error
    if (startIndex < root.startIndex) throw new Error
    if (endIndex > root.endIndex) throw new Error

    let startNode = root
    let endNode = root

    while (startNode.startIndex !== startIndex) {
    // while (startNode.startIndex !== startIndex || startNode.endIndex > endIndex) {
      if (startNode.left && startIndex >= startNode.left.startIndex && startIndex <= startNode.left.endIndex) {
        startNode = startNode.left
      } else if (startNode.right && startIndex >= startNode.right.startIndex && startIndex <= startNode.right.endIndex) {
        startNode = startNode.right
      } else {
        throw new Error
      }
    }

    while (endNode.endIndex !== endIndex) {
    // while (endNode.endIndex !== endIndex || endNode.startIndex < startIndex) {
      if (endNode.left && endIndex >= endNode.left.startIndex && endIndex <= endNode.left.endIndex) {
        endNode = endNode.left
      } else if (endNode.right && endIndex >= endNode.right.startIndex && endIndex <= endNode.right.endIndex) {
        endNode = endNode.right
      } else {
        throw new Error
      }
    }

    return Math.min(startNode.value, endNode.value)
  }

  return {
    get,
    root,
  } as SegmentTree<number>
}

// const array = [3,5,8,2,4,1,7]
// const root = createRootNode(array, (a, b) => Math.min(a, b))

// console.log(
//   root
// )

declare global {
  interface Window {
    t: any
  }
}

// window.t = createMinSegmentTree(root)


export function fillMinArraySegmentTree (
  input: number[],
  tree: number[],
  startIndex: number,
  endIndex: number,
  pos: number,
  reduce: (a: number, b: number) => number
) : void {
  if (startIndex === endIndex) {
    tree[pos] = input[startIndex]
    return
  }
  const mid = Math.floor((startIndex + endIndex) / 2)
  const left = 2 * pos + 1
  const right = 2 * pos + 2
  fillMinArraySegmentTree(input, tree, startIndex, mid, left, reduce)
  fillMinArraySegmentTree(input, tree, mid + 1, endIndex, right, reduce)
  tree[pos] = reduce(tree[left], tree[right])
}

export function createMinArraySegmentTree (
  input: number[],
  reduce: (a: number, b: number) => number,
  unit: number,
): SegmentTree<number> {
  const tree = new Array((input.length - 1) * 4)
  fillMinArraySegmentTree(input, tree, 0, input.length - 1, 0, reduce)

  function query (qlow: number, qhigh: number, low: number, high: number, pos: number): number {
    if (qlow <= low && qhigh >= high) {
      return tree[pos]
    }

    if (qlow > high || qhigh < low) {
      return unit
    }

    const mid = Math.floor((low + high) / 2)
    const left = pos * 2 + 1
    const right = pos * 2 + 2
    return reduce(
      query(qlow, qhigh, low, mid, left),
      query(qlow, qhigh, mid + 1, high, right),
    )
  }

  return {
    get (startIndex: number, endIndex: number): number {
      return query(startIndex, endIndex, 0, input.length - 1, 0)
    }
  }
}
