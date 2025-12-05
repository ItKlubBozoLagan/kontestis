export const signBigint = (value: bigint) => (value < 0 ? -1 : value > 0 ? 1 : 0);
