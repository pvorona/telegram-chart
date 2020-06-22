export const linear = (t: number) => t
export const easeInOutQuart = (t: number) => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t
// export const easeInOutQuad = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
