import { NonNegativeNumber } from "../types";

export const validateNonNegativeNumber = (n: number) => {
  if (n < 0) throw new Error(`Expected non negative number. Received ${n}`);

  return n as NonNegativeNumber;
};
