export const validateNonNegativeInt = (n: number): number => {
  if (!Number.isInteger(n) || n < 0) {
    throw Error(`Expected non negative int. Received ${n}`);
  }

  return n;
};
