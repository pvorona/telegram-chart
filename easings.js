export const linear = t => t
export const easeInOutQuart = t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t
// export const easeInOutQuad = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
