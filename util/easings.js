export const linear = t => t
export const easeInOutQuad = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
