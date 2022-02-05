import { NonNegativeInt } from "../types";

export const validateNonNegativeInt = (n: number): NonNegativeInt => {
  if (!Number.isInteger(n) || n < 0) {
    throw Error(`Expected non negative int. Received ${n}`);
  }

  return n as NonNegativeInt;
};
