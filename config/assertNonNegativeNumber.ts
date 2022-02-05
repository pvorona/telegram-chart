export const assertNonNegativeNumber = (n: number) => {
  if (n < 0) throw new Error(`Expected non negative number. Received ${n}`);

  return n;
};
