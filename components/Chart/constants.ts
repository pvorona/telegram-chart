export const enum cursors {
  resize = "ew-resize",
  grabbing = "grabbing",
  default = "",
}

export const MIN_VIEWBOX = 120;

export const DOT_BORDER_SIZE = 0;
export const DOT_SIZE = 10;
export const CENTER_OFFSET = -DOT_SIZE / 2 - DOT_BORDER_SIZE;

export const MIN_HEIGHT = 300;

export const WHEEL_CLEAR_TIMEOUT = 50;
export const WHEEL_MULTIPLIER = 3 / 16;

export const DEVIATION_FROM_STRAIGHT_LINE_DEGREES = 45;

export const FRAME = 1000 / 60;

export const INSTANT_TRANSITION = FRAME * 2;
export const VERY_FAST_TRANSITIONS_TIME = FRAME * 4;
export const FAST_TRANSITIONS_TIME = FRAME * 10;
export const LONG_TRANSITIONS_TIME = FRAME * 26;
