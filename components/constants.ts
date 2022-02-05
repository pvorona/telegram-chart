export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export enum THEME {
  LIGHT = 0,
  DARK = 1,
}

export type Cursor = typeof cursor[keyof typeof cursor];
export const cursor = {
  resize: "ew-resize",
  grabbing: "grabbing",
  default: "",
} as const;

export const MIN_VIEWBOX = 120;

export const DOT_BORDER_SIZE = 0;
export const DOT_SIZE = 10;
export const CENTER_OFFSET = -DOT_SIZE / 2 - DOT_BORDER_SIZE;

export const MIN_HEIGHT = 0;

export const WHEEL_CLEAR_TIMEOUT = 50;
export const WHEEL_MULTIPLIER = 3 / 16;

export const DEVIATION_FROM_STRAIGHT_LINE_DEGREES = 45;

export const FRAME = 1000 / 60;

export const INSTANT_TRANSITION = FRAME * 2;
export const VERY_FAST_TRANSITIONS_TIME = FRAME * 2; // viewbox
export const FAST_TRANSITIONS_TIME = FRAME * 8; // min max
export const LONG_TRANSITIONS_TIME = FRAME * 26;
