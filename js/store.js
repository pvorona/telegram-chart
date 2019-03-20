export const createStore = () => ({
  resizingViewBox: false,
  draggingViewBox: false,

  startResizingViewBox () {
    this.resizingViewBox = true
    this.draggingViewBox = false
  },

  stopResizingViewBox () {
    this.resizingViewBox = false
  },

  startDraggingViewBox () {
    this.resizingViewBox = false
    this.draggingViewBox = true
  },

  stopDraggingViewBox () {
    this.draggingViewBox = false
  },
})