import { Color } from "../types";

export const assertColor = (string: string): Color => {
  // throw new Error("Not implemented");

  return string as Color;
};
